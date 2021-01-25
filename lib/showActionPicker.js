'use strict'

const vscode = require('vscode')
const path = require('path')

const insertText = require('./insertText')
const hasTextEditor = require('./hasTextEditor')
const statusMessage = require('./statusMessage')

const settings = require('../settings')

// Show file action picker
module.exports = async chosen => {
  const http = vscode.workspace.getConfiguration('http')

  // Return false if any chosen file properties are missing
  if (!chosen.library || !chosen.version || !chosen.file) {
    vscode.window.showErrorMessage(`cdnjs: An error occurred`)
    console.error(new Error(`cdnjs: Missing file asset parameters`))
    return false
  }

  // Configuration
  const config = vscode.workspace.getConfiguration('cdnjs')

  // Determine the quote style from configuration
  const quote = settings.quoteStyles[config.get('quoteStyle')] || settings.quoteStyles[config.inspect('quoteStyle').defaultValue]

  // Determine url protocol
  const protocolConfig = config.get('protocol')
  const protocol = settings.protocols.indexOf(protocolConfig) >= 0 ? protocolConfig : config.inspect('protocol').defaultValue

  // Determine if integrity attribute is used
  const integrity = config.get('integrity') === true ? ` integrity=${quote}${chosen.sri}${quote}` : ''
  
  // Determine if crossorigin attribute is used
  const crossorigin = config.get('crossorigin') === true ? ` crossorigin=${quote}anonymous${quote}` : ''

  // Build the url for the file
  let url = `${protocol}${settings.embedUrl}/${chosen.library}/${chosen.version}/${chosen.file}`

  // Arrays of actions
  let actions = []

  // Ouptut HTML tag
  let tag = ''

  // Determine file extension
  let extension = path.extname(chosen.file)

  switch (extension) {
    // JavaScript
    case '.js':
      tag = `<script src=${quote}${url}${quote}${integrity}${crossorigin}></script>`

      // Insert <script> tag into document action
      if (hasTextEditor()) {
        actions.push({
          label: `<script>: Insert into document`,
          callback: () => {
            insertText(tag)
          }
        })
      }

      // Copy <script> tag to clipboard action
      actions.push({
        label: `<script>: Copy to clipboard`,
        callback: () => {
          vscode.env.clipboard.writeText(tag)
          statusMessage(`cdnjs: <script> tag copied to the clipboard`)
        }
      })

      break

    // CSS
    case '.css':
      tag = `<link rel=${quote}stylesheet${quote} href=${quote}${url}${quote}${integrity}${crossorigin}/>`

      // Insert <link> tag into document action
      if (hasTextEditor()) {
        actions.push({
          label: `<link>: Insert into document`,
          callback: () => {
            insertText(tag)
          }
        })
      }

      // Copy <link> tag to clipboard action
      actions.push({
        label: `<link>: Copy to clipboard`,
        callback: () => {
          vscode.env.clipboard.writeText(tag)
          statusMessage(`cdnjs: <link> tag copied to the clipboard`)
        }
      })

      break

    default:
      break
  }

  // Insert URL into document action
  if (hasTextEditor()) {
    actions.push({
      label: `URL: Insert into document`,
      callback: () => {
        insertText(url)
      }
    })
  }

  // Copy URL to clipboard action
  actions.push({
    label: `URL: Copy to clipboard`,
    callback: () => {
      vscode.env.clipboard.writeText(url)
      statusMessage(`URL copied to the clipboard`)
    }
  })

  // Open URL in browser action
  actions.push({
    label: `URL: Open in browser`,
    callback: () => {
      require('open')(url)
    }
  })

  // Insert file contents into current document action
  if (hasTextEditor()) {
    actions.push({
      label: `File Contents: Insert into current document`,
      callback: async () => {
        const got = require('got')

        let res = await got(url, {
          timeout: settings.httpRequestTimeout,
          rejectUnauthorized: http.get('proxyStrictSSL')
        })

        // Reject error if bad request
        if (res.statusCode !== 200 || !res.body.results || res.body.results.length === 0) {
          const message = `cdnjs: An error occurred while fetching file contents`
          vscode.window.showErrorMessage(message)
          console.error(new Error(message))
          return false
        }

        insertText(res.body)
      }
    })
  }

  // Insert file contents into new document action
  actions.push({
    label: `File Contents: Insert into new document`,
    callback: async () => {
      const got = require('got')

      // Get the file contents
      let res = await got(url, {
        timeout: settings.httpRequestTimeout,
        rejectUnauthorized: http.get('proxyStrictSSL')
      })

      // Reject error if bad request
      if (res.statusCode !== 200 || !res.body.results || res.body.results.length === 0) {
        const message = `cdnjs: An error occurred while fetching file contents`
        vscode.window.showErrorMessage(message)
        console.error(new Error(message))
        return false
      }

      // Create a new document
      let document = await vscode.workspace.openTextDocument({
        content: res.body
      })

      // Show the new document and populate it's contents
      vscode.window.showTextDocument(document)
    }
  })

  let action = await vscode.window.showQuickPick(actions, {
    placeHolder: url
  })

  // No action was chosen
  if (typeof action === 'undefined') {
    return
  }

  // Execute action callback
  action.callback()
}
