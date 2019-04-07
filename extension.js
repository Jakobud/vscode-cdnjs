'use strict'

const vscode = require('vscode')
const Promise = require('bluebird')
const RecentLibraries = require('./RecentLibraries')
const Cache = require('vscode-cache')

const search = require('./lib/search')
const statusMessage = require('./lib/statusMessage')
const showSearchInput = require('./lib/showSearchInput')
const showLibraryPicker = require('./lib/showLibraryPicker')
const getLibrary = require('./lib/getLibrary')
const showLibraryVersionPicker = require('./lib/showLibraryVersionPicker')
const showFilePicker = require('./lib/showFilePicker')
const showActionPicker = require('./lib/showActionPicker')

const settings = require('./settings')

let activate = context => {
  // Save the context for use in other modules
  settings.context = context

  // Recent Libraries interface
  let recentLibraries = new RecentLibraries(context, vscode.workspace)

  // Cache interfaces
  let searchCache = new Cache(context, 'search')
  let libraryCache = new Cache(context, 'library')

  vscode.commands.registerCommand('cdnjs.search', () => {
    // The chosen file
    let chosen = {}

    showSearchInput().then((value) => {
      return search(value)
    }).then((results) => {
      return showLibraryPicker(results)
    }).then((library) => {
      chosen.library = library.name

      return getLibrary(library.name)
    }).then((library) => {
      return showLibraryVersionPicker(library)
    }).then((asset) => {
      chosen.version = asset.version

      recentLibraries.add(asset)

      return showFilePicker(asset)
    }).then((file) => {
      chosen.file = file

      return showActionPicker(chosen)
    }).catch((err) => {
      console.error(err)
    })
  })

  vscode.commands.registerCommand('cdnjs.recentLibraries', () => {
    // No Recent Libraries found
    if (recentLibraries.get().length < 1) {
      // Offer search instead
      return vscode.window.showInformationMessage('No Recent Libraries. Do you want to search instead?', 'Yes')
        .then((value) => {
          if (value === 'Yes') {
            vscode.commands.executeCommand('cdnjs.search')
          }
        }, (err) => {
          console.error(err)
        })
    }

    let chosen = {}

    new Promise((resolve, reject) => {
      // Build array of recent libraries
      let items = []
      for (let library of recentLibraries.get()) {
        items.push({
          label: library.libraryName + '/' + library.version,
          asset: library
        })
      }

      // Clear recent libraries command
      items.push({
        label: 'Clear recent libraries list',
        clear: true
      })

      // Show quick pick of recent libraries
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a recent library'
      }).then((value) => {
        // No recent library was chosen
        if (typeof (value) === 'undefined') {
          return reject(new Error('No library was chosen!!!'))
        }

        if (value.clear === true) {
          recentLibraries.clear()
          return true
        }

        resolve(value.asset)
      }, (err) => {
        reject(err)
      })
    }).then((asset) => {
      // Set the chosen file's library and version'
      chosen.library = asset.libraryName
      chosen.version = asset.version

      recentLibraries.add(asset)

      return showFilePicker(asset)
    }).then((file) => {
      chosen.file = file

      return showActionPicker(chosen)
    }).catch((err) => {
      console.error(err)
    })
  })

  vscode.commands.registerCommand('cdnjs.clearCache', () => {
    // Clear the search cache
    searchCache.flush()

    // Clear the library cache
    libraryCache.flush()

    statusMessage('Cache has been cleared')
  })
}
exports.activate = activate

let deactivate = () => { }
exports.deactivate = deactivate
