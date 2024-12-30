'use strict';

import * as vscode from 'vscode';

/**
 * Displays a search input box with a specified placeholder and prompt.
 *
 * @param placeholder - The placeholder text to display in the input box.
 * @param prompt - The prompt message to display above the input box.
 * @returns A promise that resolves to the entered search term as a string,
 *          or `false` if no search term is provided.
 */
const showSearchInput = async (placeholder: string, prompt: string) => {
  const searchTerm = await vscode.window.showInputBox({
    placeHolder: placeholder,
    prompt: prompt,
  });

  // If no search term is provided, return false
  if (typeof searchTerm === 'undefined' || searchTerm === '') {
    return false;
  }

  return searchTerm;
};

export default showSearchInput;