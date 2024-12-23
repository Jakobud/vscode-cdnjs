'use strict'

const vscode = require('vscode')

// Determine if there is an active text editor that is not part of the output panel
module.exports = () => {
  return (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri !== 'output')
}
