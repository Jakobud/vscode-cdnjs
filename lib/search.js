'use strict'

const vscode = require('vscode')
const Cache = require('vscode-cache')

const statusMessage = require('./statusMessage')

const settings = require('../settings')

// For lazy loading later
let got = null

// Perform search on cdnjs.com and return JSON results
module.exports = term => {
  term = term.trim()

  // Get the search cache
  let searchCache = new Cache(settings.context, 'search')

  let promise = new Promise((resolve, reject) => {
    // Ignore empty searches
    if (!term.length) {
      return reject(new Error('No search term provided'))
    }

    // Check the cache
    if (searchCache.has(term)) {
      return resolve(searchCache.get(term))
    }

    // Lazy load got
    got = require('got')

    // Get the http configuration settings
    const http = vscode.workspace.getConfiguration('http')

    // Search for libraries
    got(settings.searchUrl + '&search=' + term, {
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
      if (!body.results || body.results.length === 0) {
        vscode.window.showErrorMessage(term + ': No libraries found')
        return false
      }

      // Fetch the cache time setting
      let cacheTime = vscode.workspace.getConfiguration('cdnjs').get('cacheTime')
      cacheTime = Number.isInteger(cacheTime) ? cacheTime : settings.config.inspect('cacheTime').defaultValue

      // Save the result to cache and resolve the search result
      searchCache.put(term, body.results, cacheTime)
        .then(() => {
          // Search results
          resolve(body.results)
        }, (err) => {
          // searchCache.put error
          reject(err)
        })
    }).catch((err) => {
      // got http request error
      reject(err)
    })
  })

  // Update Status Bar Message
  statusMessage('Searching cdnjs.com for ' + term, promise)
  return promise
}
