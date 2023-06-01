window.api = require('electron').ipcRenderer;

// wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
  let changeKeyBinding = document.getElementById('change-key-binding');
  let textInput = document.getElementById('change-key-binding-input-text')
  let submitButton = document.getElementById('change-key-binding-submit')
  submitButton.addEventListener('click', () => {
    let newKeyBinding = textInput.value;
    window.api.send('change-key-binding', newKeyBinding);
    changeKeyBinding.classList.add('hidden');
  });
});
