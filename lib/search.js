'use strict'

const vscode = require('vscode')
const Cache = require('vscode-cache')

// const statusMessage = require('./statusMessage')

const settings = require('../settings')

// Perform search on cdnjs.com and return JSON results
module.exports = async term => {
  term = term.trim()

  // Ignore empty searches
  if (!term.length) {
    const message = `cdnjs: No search term provided`
    vscode.window.showInformationMessage(message)
    console.debug(message)
    return false
  }

  // Cache settings
  let searchCache = new Cache(settings.context, 'search')
  let cacheTime = vscode.workspace.getConfiguration('cdnjs').get('cacheTime')

  // Get the http configuration settings
  const http = vscode.workspace.getConfiguration('http')

  const got = require('got')

  // Start progress
  return vscode.window.withProgress({
    title: `cdnjs: Searching for ${term}`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true
  }, async (progress, token) => {
    token.onCancellationRequested(() => {
      console.debug('cdnjs: Search was cancelled by user')
      return Promise.resolve()
    })

    // Check the cache
    if (searchCache.has(term)) {
      return searchCache.get(term)
    }

    // Search for libraries
    let res = await got(`${settings.searchUrl}&search=${term}`, {
      json: true,
      timeout: settings.httpRequestTimeout,
      rejectUnauthorized: http.get('proxyStrictSSL')
    })

    // Reject error if bad request
    if (res.statusCode !== 200) {
      const message = `cdnjs: An error occurred`
      vscode.window.showErrorMessage(message)
      console.error(message)
      return false
    }

    // Display error message if no results were found
    if (!res.body.results || res.body.results.length === 0) {
      const message = `cdnjs: "${term}" yielded no results`
      vscode.window.showWarningMessage(message)
      console.log(message)
      return false
    }

    // Cache search results
    searchCache.put(term, res.body.results, cacheTime)

    return res.body.results
  })
}
