'use strict'

const vscode = require('vscode')

const statusMessage = require('./statusMessage')

// Show picker of all libraries
module.exports = (results) => {
  // Build array of libraries
  let items = []
  for (let result of results) {
    // Create QuickPickItem for library
    let item = {
      label: result.name,
      description: result.description,
      currentVersion: result.version,
      name: result.name
    }
    items.push(item)
  }

  // Update status bar message
  statusMessage('Found ' + items.length + ' libraries')

  return new Promise((resolve, reject) => {
    // Show QuickPick of search results
    vscode.window.showQuickPick(items, {
      placeHolder: 'Choose a library (found ' + items.length + ' libraries)',
      matchOnDescription: true
    }).then((libraryName) => {
      // No library was chosen
      if (typeof (libraryName) === 'undefined') {
        return reject(new Error('No library was chosen!!!!!!!!'))
      }

      resolve(libraryName)
    }, (err) => {
      reject(err)
    })
  })
}
