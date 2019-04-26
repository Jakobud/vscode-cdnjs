'use strict'

const vscode = require('vscode')

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

  // Show QuickPick of library versions
  let asset = await vscode.window.showQuickPick(items, {
    placeHolder: `${library.name} (${items.length} versions)`
  })

  // No version was chosen
  if (typeof (asset) === 'undefined') {
    return false
  }

  return asset
}
