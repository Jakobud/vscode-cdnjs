'use strict'

const vscode = require('vscode')

const statusMessage = require('./statusMessage')

// Show library version picker
module.exports = async library => {
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

  statusMessage('cdnjs: Found ' + items.length + ' versions')

  // Show QuickPick of library versions
  let asset = await vscode.window.showQuickPick(items, {
    placeHolder: library.name
  })

  // No version was chosen
  if (typeof (asset) === 'undefined') {
    const message = `cdnjs: No library version was chosen`
    vscode.window.showWarningMessage(message)
    console.log(message)
    return false
  }

  return asset
}
