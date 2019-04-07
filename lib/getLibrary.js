'use strict'

const vscode = require('vscode')
const Cache = require('vscode-cache')

const statusMessage = require('./statusMessage')

const settings = require('../settings')

// For lazy loading later
let got = null

module.exports = (libraryName) => {

  let libraryCache = new Cache(settings.context, 'library')

  // Configuration
  const config = vscode.workspace.getConfiguration('cdnjs')

  let promise = new Promise((resolve, reject) => {
    // Check the cache
    if (libraryCache.has(libraryName)) {
      return resolve(libraryCache.get(libraryName))
    }

    // Lazy load got
    got = require('got')

    // Get the http configuration settings
    const http = vscode.workspace.getConfiguration('http')

    // Request library versions
    got(settings.baseUrl + '/' + libraryName, {
      json: true,
      timeout: settings.httpRequestTimeout,
      rejectUnauthorized: http.get('proxyStrictSSL')
    }).then((res) => {
      // Reject non-200 status code responses
      if (res.statusCode !== 200) {
        return reject(res.body)
      }

      const body = res.body

      // Display error message if no results were found
      if (body.length === 0) {
        vscode.window.showErrorMessage('The library ' + libraryName + ' was not found')
        return false
      }

      // Fetch the catch time setting
      let cacheTime = vscode.workspace.getConfiguration('cdnjs').get('cacheTime')
      cacheTime = Number.isInteger(cacheTime) ? cacheTime : config.inspect('cacheTime').defaultValue

      // Save the result to cache and resolving the search result
      libraryCache.put(libraryName, body, cacheTime)
        .then(() => {
          // Library results
          resolve(body)
        }, (err) => {
          // libraryCache.put error
          reject(err)
        })
    })
  })

  // Update Status Bar Message
  statusMessage('Fetching data for ' + libraryName, promise)
  return promise
}
