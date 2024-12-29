'use strict';

import * as vscode from 'vscode';

/**
 * Displays a search input box to the user and returns the entered search term.
 *
 * @returns {string | false} A promise that resolves to the trimmed search term entered by the user,
 * or `false` if no search term was provided.
 */
const showSearchInput = (placeholder: string): string | false => {
  // Show a search input box and get the result
  let term: string | undefined;

  (async () => {
    term = await vscode.window.showInputBox({
      placeHolder: `Example: ${placeholder}`,
      prompt: 'Search for a script or library'
    });
  })();

  // If no search term is provided, return false
  if (typeof term === 'undefined' || term === '') {
    return false;
  }

  // Trim the search term and return it
  return term.trim();
};

export default showSearchInput;