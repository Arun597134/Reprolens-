document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('api-key-input');
  const endpointInput = document.getElementById('endpoint-input');
  const saveBtn = document.getElementById('save-btn');
  const dashBtn = document.getElementById('dashboard-btn');

  chrome.storage.local.get(['apiKey', 'endpoint'], (res) => {
    if (res.apiKey) keyInput.value = res.apiKey;
    if (res.endpoint) endpointInput.value = res.endpoint;
  });

  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({
      apiKey: keyInput.value.trim(),
      endpoint: endpointInput.value.trim()
    }, () => {
      saveBtn.innerText = 'Saved!';
      setTimeout(() => { saveBtn.innerText = 'Save Config'; }, 1500);
    });
  });

  dashBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });
});
