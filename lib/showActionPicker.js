'use strict'

const vscode = require('vscode')

const clipboardCopy = require('./clipboardCopy')
const insertText = require('./insertText')

const settings = require('../settings')

let open = null

// Show file action picker
module.exports = (chosen) => {
  return new Promise((resolve, reject) => {
    // Reject if any chosen file properties are missing
    if (!chosen.library || !chosen.version || !chosen.file) {
      return reject(new Error('Missing file asset parameters'))
    }

    // Configuration
    const config = vscode.workspace.getConfiguration('cdnjs')

    // Determine the quote style from configuration
    const quote = settings.quoteStyles[config.get('quoteStyle')] || settings.quoteStyles[config.inspect('quoteStyle').defaultValue]

    // Determine url protocol
    const protocolConfig = config.get('protocol')
    const protocol = settings.protocols.indexOf(protocolConfig) >= 0 ? protocolConfig : config.inspect('protocol').defaultValue

    // Build the url for the file
    let url = protocol + settings.embedUrl + '/' + chosen.library + '/' + chosen.version + '/' + chosen.file

    // Arrays of actions
    let actions = []

    // Determine file extension
    let fileExtension = chosen.file.split('.').pop()
    let tag = ''
    switch (fileExtension) {
      case 'js':
        // JavaScript
        tag = '<script src=' + quote + url + quote + '></script>'

        // Insert <script> tag into document action
        if (vscode.window.activeTextEditor) {
          actions.push({
            label: '<script>: Insert into document',
            callback: () => {
              insertText(tag)
            }
          })
        }

        // Copy <script> tag to clipboard action
        actions.push({
          label: '<script>: Copy to clipboard',
          callback: () => {
            clipboardCopy(tag, '<script> tag copied to the clipboard')
          }
        })

        break

      case 'css':
        // CSS
        tag = '<link rel=' + quote + 'stylesheet' + quote + ' href=' + quote + url + quote + '/>'

        // Insert <link> tag into document action
        if (vscode.window.activeTextEditor) {
          actions.push({
            label: '<link>: Insert into document',
            callback: () => {
              insertText(tag)
            }
          })
        }

        // Copy <link> tag to clipboard action
        actions.push({
          label: '<link>: Copy to clipboard',
          callback: () => {
            clipboardCopy(tag, '<link> tag copied to the clipboard')
          }
        })

        break

      default:
        break
    }

    // Insert URL into document action
    if (vscode.window.activeTextEditor) {
      actions.push({
        label: 'URL: Insert into document',
        callback: () => {
          insertText(url)
        }
      })
    }

    // Copy URL to clipboard action
    actions.push({
      label: 'URL: Copy to clipboard',
      callback: () => {
        clipboardCopy(url, 'URL copied to the clipboard')
      }
    })

    // Open URL in browser action
    actions.push({
      label: 'URL: Open in browser',
      callback: () => {
        // Lazy load open
        open = require('open')

        open(url)
      }
    })

    return new Promise((resolve, reject) => {
      vscode.window.showQuickPick(actions, {
        placeHolder: url
      }).then((action) => {
        // No action was chosen
        if (typeof (action) === 'undefined') {
          return reject(new Error('No action was chosen'))
        }

        // Execute action callback
        action.callback()

        resolve()
      }, (err) => {
        reject(err)
      })
    })
  })
}
