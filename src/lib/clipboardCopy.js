let copyPaste = null;

const statusMessage = require('./statusMessage');

// Copy text to clipboard and set statusBarMessage
export default (text, message) => {
  // Lazy load copy-paste
  copyPaste = require('copy-paste');

  copyPaste.copy(text, () => {
    if (message) {
      statusMessage(message);
    }
  });
};
