'use strict'

const vscode = require('vscode')

const statusMessage = require('./statusMessage')

// Show library version file picker
module.exports = async asset => {
  // Build array of files
  let items = []
  for (let file of asset.files) {
    items.push(file)
  }

  statusMessage('cdnjs: Found ' + items.length + ' files')

  // Show QuickPick of asset files
  let file = await vscode.window.showQuickPick(items, {
    placeHolder: asset.libraryName + '/' + asset.version + '/'
  })

  // No file was chosen
  if (typeof (file) === 'undefined') {
    const message = `cdnjs: No file was chosen`
    vscode.window.showWarningMessage(message)
    console.log(message)
    return false
  }

  return file
}
