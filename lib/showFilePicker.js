'use strict'

const vscode = require('vscode')

const statusMessage = require('./statusMessage')

// Show library version file picker
module.exports = (asset) => {
  return new Promise((resolve, reject) => {
    // Build array of files
    let items = []
    for (let file of asset.files) {
      items.push(file)
    }

    statusMessage('Found ' + items.length + ' files')

    // Show QuickPick of asset files
    vscode.window.showQuickPick(items, {
      placeHolder: asset.libraryName + '/' + asset.version + '/'
    }).then((file) => {
      // No file was chosen
      if (typeof (file) === 'undefined') {
        return reject(new Error('No library file was chosen'))
      }

      resolve(file)
    }, (err) => {
      reject(err)
    })
  })
}
