'use strict'

const vscode = require('vscode')

// Insert text into active document at cursor positions
module.exports = async text => {
  let textEditor = vscode.window.activeTextEditor

  // Ignore if no active TextEditor
  if (typeof (textEditor) === 'undefined') {
    return false
  }

  // Get the active text document's uri
  let uri = textEditor.document.uri

  // Create a new TextEdit for each selection
  let edits = []
  for (let selection of textEditor.selections) {
    edits.push(vscode.TextEdit.insert(selection.active, text))
  }

  // New WorkspaceEdit
  let edit = new vscode.WorkspaceEdit()
  edit.set(uri, edits)

  // Applying the WorkspaceEdit
  await vscode.workspace.applyEdit(edit)

  // Clear the selection
  textEditor.selection = new vscode.Selection(textEditor.selection.end, textEditor.selection.end)

  return true
}
