'use strict';

import * as vscode from 'vscode';
import Cache from 'vscode-cache';
import got from 'got';

import settings from '../settings.js';

// A single library search result
interface Result {
  name: string;
  description: string;
  latest: string;
}

// The search results
interface Data {
  available: number
  results: Result[]
  total: number
}

// Perform search on cdnjs.com and return JSON results
const search = async (term: string) => {
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
    let data: Data;
    try {
      data = await got(`${settings.baseUrl}?search=${term}&fields=name,description`, {
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

    // Display error message if no results were found
    if (!data.results || data.results.length === 0) {
      const message = `cdnjs: Search for "${term}" yielded no results`;
      vscode.window.showInformationMessage(message);
      return false;
    }

    const results: Result[] = data.results;

    // Cache search results
    const cacheTime: number | undefined = vscode.workspace.getConfiguration('cdnjs').get<number>('cacheTime');
    searchCache.put(term, results, cacheTime);

    return results;
  });
};

export default search;