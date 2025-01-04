'use strict';

import * as vscode from 'vscode';
import Cache from 'vscode-cache';
import got from 'got';

import settings from '../settings';

export default async (libraryName: string) => {
  const libraryCache = new Cache(settings.context, 'library');
  const cacheName = `${libraryName}-versions`;

  // Check the cache
  if (libraryCache.has(cacheName)) {
    return libraryCache.get(cacheName);
  }

  // Start progress
  return vscode.window.withProgress({
    title: `cdnjs: Fetching library ${libraryName}`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true
  }, async (progress, token) => {
    token.onCancellationRequested(() => {
      console.debug('cdnjs: Fetch was cancelled by user');
      return Promise.resolve();
    });

    // Get the http configuration settings
    const http = vscode.workspace.getConfiguration('http');

    // Request library versions
    let data;
    try {
      // Fetch the versions of the library
      data = await got(`${settings.baseUrl}/${libraryName}?fields=versions`, {
        // Request timeout
        timeout: { request: settings.httpRequestTimeout },
        // Reject unauthorized SSL settings from VSCode
        https: { rejectUnauthorized: http.get('proxyStrictSSL') },
      }).json();
    } catch (error) {
      const message = `cdnjs: An error occurred`;
      vscode.window.showErrorMessage(message);
      console.error(new Error(message));
      return false;
    }

    // Display error message if no results were found
    if (!data || Object.keys(data).length === 0) {
      vscode.window.showErrorMessage(`cdnjs: Library ${libraryName} was not found`);
      return false;
    }

    // Configuration
    const config = vscode.workspace.getConfiguration('cdnjs');

    // Fetch the catch time setting
    let cacheTime: number = config.get('cacheTime') as number;
    if (!Number.isInteger(cacheTime)) {
      cacheTime = config.inspect('cacheTime')!.defaultValue as number;
    }

    // Save the result to cache and resolving the search result
    libraryCache.put(cacheName, data, cacheTime);

    return data;
  });
};
