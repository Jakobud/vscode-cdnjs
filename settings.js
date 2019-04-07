'use strict'

const vscode = require('vscode')

let settings = {}

settings.baseUrl = 'https://api.cdnjs.com/libraries'
settings.searchUrl = settings.baseUrl + '?fields=version,description,homepage'
settings.embedUrl = 'cdnjs.cloudflare.com/ajax/libs'
settings.httpRequestTimeout = 5000
settings.statusBarMessageTimeout = 5000
settings.config = vscode.workspace.getConfiguration('cdnjs')
settings.quoteStyles = {
  'single': "'",
  'double': '"'
}
settings.protocols = ['https://', 'http://', '//']

module.exports = settings
