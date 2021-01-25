'use strict'

const vscode = require('vscode')
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

  vscode.commands.registerCommand('cdnjs.search', async () => {
    // Get a search term
    let term = await showSearchInput()
    if (!term) {
      return
    }

    // Perform the search on the API
    let results = await search(term)
    if (results.length === false) {
      return
    }

    // Pick a library from the search results
    let library = await showLibraryPicker(results)
    if (library === false) {
      return
    }

    // Fetch the library information from the API
    library = await getLibrary(library.name)

    // Pick a version from the library versions
    let asset = await showLibraryVersionPicker(library)
    if (!asset) {
      return
    }

    // Add the library version to the list of recent libraries
    recentLibraries.add(asset)

    // Pick the file
    let file = await showFilePicker(asset)
    if (!file) {
      return
    }

    let chosenFile = {
      library: library.name,
      version: asset.version,
      file: file,
      sri: asset.sri[file]
    }

    // Pick the action to take on the file
    showActionPicker(chosenFile)
  })

  vscode.commands.registerCommand('cdnjs.recentLibraries', async () => {
    // No Recent Libraries found
    if (recentLibraries.get().length < 1) {
      // Offer search instead
      let value = await vscode.window.showInformationMessage('cdnjs: No Recent Libraries. Do you want to search instead?', 'Yes', 'No')
      if (value === 'Yes') {
        vscode.commands.executeCommand('cdnjs.search')
      }
      return
    }

    let chosen = {}

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
    let value = await vscode.window.showQuickPick(items, {
      placeHolder: 'Choose a recent library'
    })

    // No recent library was chosen
    if (typeof (value) === 'undefined') {
      console.error(`No library was chosen`)
      return
    }

    // Clear recent libraries list
    if (value.clear === true) {
      recentLibraries.clear()
      return true
    }

    let asset = value.asset

    // Set the chosen file's library and version'
    chosen.library = asset.libraryName
    chosen.version = asset.version
    
    recentLibraries.add(asset)
    
    // Pick the file from the library version
    let file = await showFilePicker(asset)
    
    chosen.file = file
    chosen.sri = asset.sri[file]

    showActionPicker(chosen)
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
