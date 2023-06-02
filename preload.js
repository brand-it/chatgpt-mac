const { ipcRenderer, process } = require('electron');
const log = require('electron-log');
window.api = ipcRenderer;

// wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const alwaysOnTop = document.getElementById('change-always-on-top');
  const changeSettings = document.getElementById('change-settings');
  const loading = document.getElementById('loading');
  const submitButton = document.getElementById('change-settings-submit')
  const textInput = document.getElementById('change-key-binding-input-text')
  const webview = document.getElementById('webview');
  const defaultKeyBinding = 'CommandOrControl+Shift+g';
  let keyString = '';

 

  textInput.addEventListener('focus', () => {
    textInput.value = '';
    keyString = '';
  });
  textInput.addEventListener('blur', () => {
    if (textInput.value === '') {
      textInput.value = defaultKeyBinding;
    }
  });

  textInput.addEventListener('keydown', (event) => {
    // prevent default behavior
    event.preventDefault();
    // don't add the same key twice
    if (keyString.indexOf(event.key) === -1) {
      if (keyString !== '') {
        keyString += '+';
      }
      keyString += event.key;
    }
    textInput.value = keyString;
  });

  submitButton.addEventListener('click', () => {
    let newKeyBinding = textInput.value;
    let alwaysOnTopValue = alwaysOnTop.checked;
    window.api.send('change-always-on-top', alwaysOnTopValue);
    window.api.send('change-key-binding', newKeyBinding);
    changeSettings.classList.add('hidden');
  });


  webview.addEventListener('did-finish-load', () => {
    log.debug('webview did-finish-load');
    loading.remove();
    loading.classList.remove('center');
  });

  ipcRenderer.on('show-settings', (event, values) => {
    log.debug('show-settings', values);
    changeSettings.classList.remove('hidden');
    textInput.value = values.keyBinding;
    alwaysOnTop.checked = values.alwaysOnTop;
  })
});
