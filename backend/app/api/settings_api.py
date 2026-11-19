import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schema import SystemSetting

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    github_token: str | None = None
    default_github_repo: str | None = None
    default_github_branch: str | None = None
    slack_webhook_url: str | None = None
    discord_webhook_url: str | None = None
    mask_passwords: bool = True
    mask_emails: bool = True
    mask_credit_cards: bool = True
    filter_query_params: bool = True
    default_reproduction_timeout_s: int = 30

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    config_dict = {s.key: s.value for s in settings_records}

    gemini_key = config_dict.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY", "")
    openai_key = config_dict.get("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY", "")
    anthropic_key = config_dict.get("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")
    github_token = config_dict.get("GITHUB_TOKEN") or os.getenv("GITHUB_TOKEN", "")
    default_repo = config_dict.get("DEFAULT_GITHUB_REPO") or os.getenv("DEFAULT_GITHUB_REPO", "Arun597134/Arun-M-portfolio-")
    default_branch = config_dict.get("DEFAULT_GITHUB_BRANCH") or os.getenv("DEFAULT_GITHUB_BRANCH", "master")

    return {
        "has_gemini_key": bool(gemini_key),
        "has_openai_key": bool(openai_key),
        "has_anthropic_key": bool(anthropic_key),
        "has_github_token": bool(github_token),
        "gemini_api_key": gemini_key,
        "openai_api_key": openai_key,
        "anthropic_api_key": anthropic_key,
        "github_token": github_token,
        "default_github_repo": default_repo,
        "default_github_branch": default_branch,
        "has_slack_webhook": bool(config_dict.get("SLACK_WEBHOOK_URL")),
        "has_discord_webhook": bool(config_dict.get("DISCORD_WEBHOOK_URL")),
        "slack_webhook_url": config_dict.get("SLACK_WEBHOOK_URL", ""),
        "discord_webhook_url": config_dict.get("DISCORD_WEBHOOK_URL", ""),
        "mask_passwords": config_dict.get("mask_passwords", "true") == "true",
        "mask_emails": config_dict.get("mask_emails", "true") == "true",
        "mask_credit_cards": config_dict.get("mask_credit_cards", "true") == "true",
        "filter_query_params": config_dict.get("filter_query_params", "true") == "true",
        "default_reproduction_timeout_s": int(config_dict.get("default_reproduction_timeout_s", "30"))
    }

@router.post("")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    def set_or_update(key: str, val: str):
        record = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not record:
            record = SystemSetting(key=key, value=val)
            db.add(record)
        else:
            record.value = val

    if data.gemini_api_key is not None:
        set_or_update("GEMINI_API_KEY", data.gemini_api_key)
    if data.openai_api_key is not None:
        set_or_update("OPENAI_API_KEY", data.openai_api_key)
    if data.anthropic_api_key is not None:
        set_or_update("ANTHROPIC_API_KEY", data.anthropic_api_key)
    if data.github_token is not None:
        set_or_update("GITHUB_TOKEN", data.github_token.strip())
    if data.default_github_repo is not None:
        set_or_update("DEFAULT_GITHUB_REPO", data.default_github_repo.strip())
    if data.default_github_branch is not None:
        set_or_update("DEFAULT_GITHUB_BRANCH", data.default_github_branch.strip() or "main")
    if data.slack_webhook_url is not None:
        set_or_update("SLACK_WEBHOOK_URL", data.slack_webhook_url.strip())
    if data.discord_webhook_url is not None:
        set_or_update("DISCORD_WEBHOOK_URL", data.discord_webhook_url.strip())

    set_or_update("mask_passwords", str(data.mask_passwords).lower())
    set_or_update("mask_emails", str(data.mask_emails).lower())
    set_or_update("mask_credit_cards", str(data.mask_credit_cards).lower())
    set_or_update("filter_query_params", str(data.filter_query_params).lower())
    set_or_update("default_reproduction_timeout_s", str(data.default_reproduction_timeout_s))

    db.commit()
    return {"status": "saved"}
