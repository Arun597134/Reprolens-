import re
from typing import Any
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

class PrivacySanitizer:
    """
    Industrial Privacy & Data Sanitization Engine for ReproLens.
    Runs locally in Extension/SDK, and strictly enforced on Backend before
    persisting into database or feeding into AI models.
    """

    REDACTED_TEXT = "[REDACTED]"
    MAX_STRING_LENGTH = 10000

    # Sensitive key patterns (case-insensitive substring or exact match)
    SENSITIVE_KEY_PATTERNS = [
        r"pass(word)?",
        r"secret",
        r"token",
        r"bearer",
        r"auth(orization)?",
        r"api[-_]?key",
        r"credit[-_]?card",
        r"card[-_]?number",
        r"cvv|cvc",
        r"ssn",
        r"pin",
        r"private[-_]?key",
        r"session[-_]?id",
        r"otp"
    ]

    # Sensitive regex patterns in values
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    JWT_REGEX = re.compile(r"\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b")
    BEARER_REGEX = re.compile(r"Bearer\s+[A-Za-z0-9-._~+/]+=*", re.IGNORECASE)
    CREDIT_CARD_REGEX = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
    SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
    PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")

    # Sensitive query parameter keys
    SENSITIVE_QUERY_PARAMS = {
        "token", "access_token", "id_token", "refresh_token", "api_key", "apikey",
        "key", "password", "pwd", "auth", "session", "secret", "cvv"
    }

    # Sensitive HTTP headers
    SENSITIVE_HEADERS = {
        "authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token",
        "proxy-authorization", "token"
    }

    def __init__(self, custom_keywords: list[str] | None = None):
        self.sensitive_keywords = set(custom_keywords or [])
        self.key_regex = re.compile(
            "|".join(self.SENSITIVE_KEY_PATTERNS + [re.escape(k) for k in self.sensitive_keywords]),
            re.IGNORECASE
        )

    def is_luhn_valid(self, cc_digits: str) -> bool:
        """Validates credit card numbers with Luhn check algorithm."""
        digits = [int(c) for c in cc_digits if c.isdigit()]
        if len(digits) < 13 or len(digits) > 19:
            return False
        total = 0
        reverse_digits = digits[::-1]
        for i, digit in enumerate(reverse_digits):
            if i % 2 == 1:
                doubled = digit * 2
                total += doubled - 9 if doubled > 9 else doubled
            else:
                total += digit
        return total % 10 == 0

    def sanitize_string(self, text: str) -> str:
        """Redacts sensitive substrings like emails, tokens, cards within text."""
        if not text:
            return text
        
        # Guard against huge string memory attacks
        if len(text) > self.MAX_STRING_LENGTH:
            text = text[:self.MAX_STRING_LENGTH] + "... [TRUNCATED_FOR_SAFETY]"

        # Redact JWTs
        text = self.JWT_REGEX.sub(self.REDACTED_TEXT, text)
        # Redact Bearer tokens
        text = self.BEARER_REGEX.sub("Bearer " + self.REDACTED_TEXT, text)
        # Redact Emails
        text = self.EMAIL_REGEX.sub(self.REDACTED_TEXT, text)
        # Redact SSNs
        text = self.SSN_REGEX.sub(self.REDACTED_TEXT, text)

        # Redact embedded URLs with sensitive query params
        if "http://" in text or "https://" in text:
            if "?" in text:
                text = re.sub(
                    r"https?://[^\s\"'<>]+",
                    lambda m: self.sanitize_url(m.group(0)),
                    text
                )

        # Redact Credit Cards with Luhn check
        for match in self.CREDIT_CARD_REGEX.finditer(text):
            candidate = match.group(0)
            clean_digits = re.sub(r"\D", "", candidate)
            if self.is_luhn_valid(clean_digits):
                text = text.replace(candidate, self.REDACTED_TEXT)

        return text

    def sanitize_url(self, url_str: str) -> str:
        """Sanitizes URL query parameters containing tokens or secrets."""
        if not url_str:
            return url_str
        try:
            parsed = urlparse(url_str)
            if not parsed.query:
                return url_str
            queries = parse_qs(parsed.query, keep_blank_values=True)
            sanitized_queries = {}
            for k, vals in queries.items():
                if k.lower() in self.SENSITIVE_QUERY_PARAMS or self.key_regex.search(k):
                    sanitized_queries[k] = [self.REDACTED_TEXT for _ in vals]
                else:
                    sanitized_queries[k] = [self.sanitize_string(v) for v in vals]
            new_query = urlencode(sanitized_queries, doseq=True)
            return urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
        except Exception:
            return self.REDACTED_TEXT

    def sanitize_headers(self, headers: dict[str, Any]) -> dict[str, Any]:
        """Redacts auth headers and cookie payloads."""
        sanitized = {}
        for k, v in headers.items():
            if k.lower() in self.SENSITIVE_HEADERS or self.key_regex.search(k):
                sanitized[k] = self.REDACTED_TEXT
            elif isinstance(v, str):
                sanitized[k] = self.sanitize_string(v)
            else:
                sanitized[k] = v
        return sanitized

    def sanitize_data(self, data: Any, current_key: str = "") -> Any:
        """
        Recursively walks objects, arrays, and primitives to sanitize
        sensitive keys, values, and payloads.
        """
        if data is None:
            return None

        # Check if the key itself implies a secret
        if current_key and self.key_regex.search(current_key):
            return self.REDACTED_TEXT

        if isinstance(data, dict):
            sanitized_dict = {}
            for k, v in data.items():
                # Specific URL handling
                if k.lower() in ("url", "href", "endpoint", "request_url", "response_url") and isinstance(v, str):
                    sanitized_dict[k] = self.sanitize_url(v)
                elif k.lower() in ("headers", "request_headers", "response_headers") and isinstance(v, dict):
                    sanitized_dict[k] = self.sanitize_headers(v)
                else:
                    sanitized_dict[k] = self.sanitize_data(v, current_key=k)
            return sanitized_dict

        elif isinstance(data, list):
            return [self.sanitize_data(item, current_key=current_key) for item in data]

        elif isinstance(data, str):
            return self.sanitize_string(data)

        return data

sanitizer = PrivacySanitizer()
