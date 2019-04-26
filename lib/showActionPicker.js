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
    console.error(`cdnjs: Missing file asset parameters`)
    vscode.window.showErrorMessage(`cdnjs: An error occurred`)
    return false
  }

  // Configuration
  const config = vscode.workspace.getConfiguration('cdnjs')

  // Determine the quote style from configuration
  const quote = settings.quoteStyles[config.get('quoteStyle')] || settings.quoteStyles[config.inspect('quoteStyle').defaultValue]

  // Determine url protocol
  const protocolConfig = config.get('protocol')
  const protocol = settings.protocols.indexOf(protocolConfig) >= 0 ? protocolConfig : config.inspect('protocol').defaultValue

  // Build the url for the file
  let url = `${protocol}${settings.embedUrl}/${chosen.library}/${chosen.version}/${chosen.file}`

  // Arrays of actions
  let actions = []

  // Determine file extension
  let extension = path.extname(chosen.file)
  let tag = ''
  switch (extension) {
    // JavaScript
    case 'js':
      tag = `<script src=${quote}${url}${quote}></script>`

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
    case 'css':
      tag = `<link rel=${quote}stylesheet${quote} href=${quote}url${quote}/>`

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

        // TODO: Handle non 200 error, no body, etc

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

      // TODO: Handle bad requests, etc

      // Create a new document
      let document = await vscode.workspace.openTextDocument({
        content: res.body
      })

      // TODO: Handle error?

      // Show the new document and populate it's contents
      vscode.window.showTextDocument(document)
    }
  })

  let action = await vscode.window.showQuickPick(actions, {
    placeHolder: url
  })

  // No action was chosen
  if (typeof action === 'undefined') {
    console.debug(`No action was taken on the file`)
    return
  }

  // Execute action callback
  action.callback()
}
