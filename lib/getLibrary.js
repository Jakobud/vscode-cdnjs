'use strict'

const vscode = require('vscode')
const Cache = require('vscode-cache')

const settings = require('../settings')

module.exports = async libraryName => {
  let libraryCache = new Cache(settings.context, 'library')

  // Configuration
  const config = vscode.workspace.getConfiguration('cdnjs')

  // Check the cache
  if (libraryCache.has(libraryName)) {
    return libraryCache.get(libraryName)
  }

  // Get the http configuration settings
  const http = vscode.workspace.getConfiguration('http')

  // Start progress
  return vscode.window.withProgress({
    title: `cdnjs: Fetching library ${libraryName}`,
    location: vscode.ProgressLocation.Notification,
    cancellable: true
  }, async (progress, token) => {
    token.onCancellationRequested(() => {
      console.debug('cdnjs: Fetch was cancelled by user')
      return Promise.resolve()
    })

    const got = require('got')

    // Request library versions
    let res = await got(settings.baseUrl + '/' + libraryName, {
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

    const body = res.body

    // Display error message if no results were found
    if (body.length === 0) {
      vscode.window.showErrorMessage(`cdnjs: ${libraryName} was not found`)
      return false
    }

    // Fetch the catch time setting
    let cacheTime = vscode.workspace.getConfiguration('cdnjs').get('cacheTime')
    cacheTime = Number.isInteger(cacheTime) ? cacheTime : config.inspect('cacheTime').defaultValue

    // Save the result to cache and resolving the search result
    libraryCache.put(libraryName, body, cacheTime)

    return body
  })
}
