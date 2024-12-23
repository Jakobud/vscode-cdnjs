'use strict'

const vscode = require('vscode')

const settings = require('../settings')

// Display search box and return input
module.exports = async () => {
  let term = await vscode.window.showInputBox({
    placeHolder: `Example: ${settings.searchPlaceholders[Math.floor(Math.random() * settings.searchPlaceholders.length)]}`,
    prompt: 'Search for a script or library'
  })

  term = term.trim()

  if (typeof term === 'undefined' || term === '') {
    return false
  }

  return term
}
