'use strict'

const vscode = require('vscode')

const statusMessage = require('./statusMessage')

// Show library version picker
module.exports = (library) => {
  return new Promise((resolve, reject) => {
    // Build array of library versions
    let items = []
    for (let asset of library.assets) {
      // QuickPickItem for the library version
      let item = {
        label: asset.version,
        files: asset.files,
        version: asset.version,
        libraryName: library.name
      }

      // Add description if this is the current/latest/stable version
      if (asset.version === library.version) {
        item.description = 'current version'
      }
      items.push(item)
    }

    statusMessage('Found ' + items.length + ' versions')

    // Show QuickPick of library versions
    vscode.window.showQuickPick(items, {
      placeHolder: library.name
    }).then((asset) => {
      // No version was chosen
      if (typeof (asset) === 'undefined') {
        return reject(new Error('No library version was chosen'))
      }

      resolve(asset)
    }, (err) => {
      reject(err)
    })
  })
}
