'use strict'

const vscode = require('vscode')

const settings = require('../settings')

// Display search box and return input
module.exports = async () => {
  let value = await vscode.window.showInputBox({
    placeHolder: settings.searchPlaceholders[Math.floor(Math.random() * settings.searchPlaceholders.length)],
    prompt: 'Search for a script or library'
  })

  return value.trim()
}
