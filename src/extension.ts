'use strict';

import * as vscode from 'vscode';
import Cache from 'vscode-cache';

import RecentLibraries from './RecentLibraries';
import search from './lib/search';
import statusMessage from './lib/statusMessage';
import showSearchInput from './lib/showSearchInput';
import showLibraryPicker from './lib/showLibraryPicker';
import getLibrary from './lib/getLibrary';
import showLibraryVersionPicker from './lib/showLibraryVersionPicker';
import showFilePicker from './lib/showFilePicker';
import showActionPicker from './lib/showActionPicker';
import settings from './settings';

export function activate(context: vscode.ExtensionContext) {

  // Save the context for use in other modules
  settings.context = context;

  // Recent Libraries interface
  let recentLibraries = new RecentLibraries(context, vscode.workspace);

  // Cache interfaces
  let searchCache = new Cache(context, 'search');
  let libraryCache = new Cache(context, 'library');

  vscode.commands.registerCommand('cdnjs.search', async () => {
    // Get a search term
    const searchPlaceholder = `Example: ${settings.searchPlaceholders[Math.floor(Math.random() * settings.searchPlaceholders.length)]}`;
    const searchPrompt = `Search for a script or library`;
    const searchTerm = await showSearchInput(searchPlaceholder, searchPrompt) as string | false;

    // No search term was provided
    if (!searchTerm) {
      return;
    }

    // Perform the search on the API
    let results = await search(searchTerm);
    if (results.length === false) {
      return;
    }

    // Pick a library from the search results
    let library = await showLibraryPicker(results);
    if (library === false) {
      return;
    }

    // Fetch the library information from the API
    library = await getLibrary(library.name);

    // Pick a version from the library versions
    let asset = await showLibraryVersionPicker(library);
    if (!asset) {
      return;
    }

    // Add the library version to the list of recent libraries
    recentLibraries.add(asset);

    // Pick the file
    let file = await showFilePicker(asset);
    if (!file) {
      return;
    }

    let chosenFile = {
      library: library.name,
      version: asset.version,
      file: file,
      sri: asset.sri[file]
    };

    // Pick the action to take on the file
    showActionPicker(chosenFile);
  });

  vscode.commands.registerCommand('cdnjs.recentLibraries', async () => {
    // No Recent Libraries found
    if (recentLibraries.get().length < 1) {
      // Offer search instead
      let value = await vscode.window.showInformationMessage('cdnjs: No Recent Libraries. Do you want to search instead?', 'Yes', 'No');
      if (value === 'Yes') {
        vscode.commands.executeCommand('cdnjs.search');
      }
      return;
    }

    interface Chosen {
      library: string;
      version: string;
      file: string;
      sri: string;
    }
    let chosen: Chosen = {} as Chosen;

    // Build array of recent libraries
    let items = [];
    for (let library of recentLibraries.get()) {
      items.push({
        label: library.libraryName + '/' + library.version,
        asset: library
      });
    }

    // Clear recent libraries command
    items.push({
      label: 'Clear recent libraries list',
      clear: true
    });

    // Show quick pick of recent libraries
    let value = await vscode.window.showQuickPick(items, {
      placeHolder: 'Choose a recent library'
    });

    // No recent library was chosen
    if (typeof (value) === 'undefined') {
      console.error(`No library was chosen`);
      return;
    }

    // Clear recent libraries list
    if (value.clear === true) {
      recentLibraries.clear();
      return true;
    }

    let asset = value.asset;

    // Set the chosen file's library and version'
    chosen.library = asset.libraryName;
    chosen.version = asset.version;

    recentLibraries.add(asset);

    // Pick the file from the library version
    let file = await showFilePicker(asset);

    chosen.file = file;
    chosen.sri = asset.sri[file];

    showActionPicker(chosen);
  });

  vscode.commands.registerCommand('cdnjs.clearCache', () => {
    // Clear the search cache
    searchCache.flush();

    // Clear the library cache
    libraryCache.flush();

    statusMessage('Cache has been cleared');
  });
}

export function deactivate() { }
