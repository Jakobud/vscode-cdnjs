'use strict'

const vscode = require('vscode')

const settings = require('../settings')

// Display search box and return input
module.exports = () => {
  return new Promise((resolve, reject) => {
    vscode.window.showInputBox({
      placeHolder: settings.searchPlaceholders[Math.floor(Math.random() * settings.searchPlaceholders.length)],
      prompt: 'Search for a script or library'
    }).then((value) => {
      // No search string was specified
      if (typeof (value) === 'undefined') {
        return reject(new Error('No search string was specified'))
      }

      resolve(value)
    }, (err) => {
      reject(err)
    })
  })
}
