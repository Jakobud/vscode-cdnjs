'use strict';

import * as vscode from 'vscode';

import settings from '../settings';

// Display search box and return input
export default async () => {
  // Show a search input box and get the result
  let term = await vscode.window.showInputBox({
    placeHolder: `Example: ${settings.searchPlaceholders[Math.floor(Math.random() * settings.searchPlaceholders.length)]}`,
    prompt: 'Search for a script or library'
  });

  // If no search term is provided, return false
  if (typeof term === 'undefined' || term === '') {
    return false;
  }

  // Trim the search term and return it
  return term.trim();
};
