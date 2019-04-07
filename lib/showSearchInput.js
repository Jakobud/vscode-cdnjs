'use strict'

const vscode = require('vscode')

// Display search box and return input
module.exports = () => {
  return new Promise((resolve, reject) => {
    vscode.window.showInputBox({
      placeHolder: 'Search for a script or library. For example: jquery'
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
