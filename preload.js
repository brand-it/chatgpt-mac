const { ipcRenderer, app } = require('electron');
const log = require('electron-log');
const fs = require('fs');
const path = require('path');


const packagePath = path.join(__dirname, 'package.json');
const packageData = fs.readFileSync(packagePath, 'utf8');
const packageJson = JSON.parse(packageData);

const appVersion = packageJson.version;
window.api = ipcRenderer;


function blank(string) { return string === '' || string === undefined || string === null }

function hasKeyBinding(keyString, key) {
  blank(keyString) && (keyString.includes(`+${key}`) || keyString.startsWith(key))
}

// wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
  const alwaysOnTop = document.getElementById('change-always-on-top');
  const changeSettings = document.getElementById('change-settings');
  const loading = document.getElementById('loading');
  const submitButton = document.getElementById('change-settings-submit')
  const textInput = document.getElementById('change-key-binding-input-text')
  const webview = document.getElementById('webview');
  const defaultKeyBinding = 'CommandOrControl+Shift+g';
  const keyBindingClearButton = document.getElementById('key-binding-clear-button');
  const currentVersion = document.getElementById('current-version');
  let keyString = '';
  currentVersion.innerHTML = `v${appVersion}`;

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
    // don't add the same key twice by looking for +key or starts with key
    if (!hasKeyBinding(keyString, event.key)) {
      if (!blank(keyString)) { keyString += '+'; }
      keyString += event.key;
    }
    log.debug('keyString', keyString)
    textInput.value = keyString;
  });

  keyBindingClearButton.addEventListener('click', () => {
    textInput.value = defaultKeyBinding;
    keyString = '';
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
