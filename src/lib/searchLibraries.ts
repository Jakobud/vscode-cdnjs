'use strict';

import * as vscode from 'vscode';
import Cache from 'vscode-cache';
import got from 'got';
import { LibrarySearchResult } from '../interfaces';

import settings from '../settings.js';

// Perform search on cdnjs.com and return JSON results
export default async (term: string) => {
  term = term.trim();

  // Ignore empty searches
  if (!term.length) {
    const message = `cdnjs: No search term provided`;
    vscode.window.showInformationMessage(message);
    console.debug(message);
    return false;
  }

  // Start progress
  return vscode.window.withProgress({
    title: `cdnjs: Searching for ${term}`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true
  }, async (progress, token) => {
    token.onCancellationRequested(() => {
      console.debug('cdnjs: Search was cancelled');
      return Promise.resolve();
    });

    // Check for the search result in the cache
    const searchCache = new Cache(settings.context, 'search');
    if (searchCache.has(term)) {
      return searchCache.get(term);
    }

    // Get the http configuration settings
    const http: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('http');

    // Search for libraries
    let librarySearchResults: {
      results: LibrarySearchResult[];
      available: number;
      total: number;
    };

    try {
      librarySearchResults = await got(`${settings.baseUrl}?search=${term}&fields=name,description,latest`, {
        timeout: { request: settings.httpRequestTimeout },
        https: { rejectUnauthorized: http.get('proxyStrictSSL') },
      }).json();

    } catch (error) {
      // Reject error if bad request
      const message = `cdnjs: An error occurred while searching`;
      vscode.window.showErrorMessage(message);
      console.error(message);
      return false;
    }

    console.debug(librarySearchResults);

    // Display error message if no results were found
    if (!librarySearchResults.results || librarySearchResults.results.length === 0) {
      const message = `cdnjs: Search for "${term}" yielded no results`;
      vscode.window.showInformationMessage(message);
      return false;
    }

    const results: LibrarySearchResult[] = librarySearchResults.results;

    // Cache search results
    const cacheTime: number | undefined = vscode.workspace.getConfiguration('cdnjs').get<number>('cacheTime');
    searchCache.put(term, results, cacheTime);

    return results;
  });
};
