'use strict'

const vscode = require('vscode')

// Show library version file picker
module.exports = async asset => {
  // Build array of files
  let items = []
  for (let file of asset.files) {
    items.push(file)
  }

  // Show QuickPick of asset files
  let file = await vscode.window.showQuickPick(items, {
    placeHolder: `${asset.libraryName}/${asset.version}/ (${items.length} files)`
  })

  // No file was chosen
  if (typeof (file) === 'undefined') {
    return false
  }

  return file
}
