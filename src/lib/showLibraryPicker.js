'use strict';

import * as vscode from 'vscode';

import statusMessage from './statusMessage';

// Show picker of all libraries
export default async results => {
  // Build array of libraries
  let items = [];
  for (let result of results) {
    // Create QuickPickItem for library
    let item = {
      label: result.name,
      description: result.description,
      currentVersion: result.version,
      name: result.name
    };
    items.push(item);
  }

  // Update status bar message
  statusMessage(`cdnjs: Found ${items.length} libraries`);

  // Show QuickPick of search results
  let library = await vscode.window.showQuickPick(items, {
    placeHolder: `Choose a library (${items.length} results)`,
    matchOnDescription: true
  });

  if (typeof library === 'undefined') {
    return false;
  }

  return library;
};
