'use strict';

import * as vscode from 'vscode';

import statusMessage from './statusMessage';

import { LibrarySearchResult, Library, QuickPickItem } from '../interfaces';

// Show picker of all libraries
export default async (libraries: LibrarySearchResult[]) => {
  // Build array of libraries
  const items: QuickPickItem[] = [];

  for (let library of libraries) {
    // Create QuickPickItem for library
    items.push({
      label: library.name,
      description: library.description
    });
  }

  // Update status bar message
  statusMessage(`cdnjs: Found ${items.length} libraries`);

  // Show QuickPick of search results
  const library: Library | undefined = await vscode.window.showQuickPick(items, {
    placeHolder: `Choose a library (${items.length} results)`,
    matchOnDescription: true
  });

  if (typeof library === 'undefined') {
    return false;
  }

  console.debug(library);

  return library;
};
