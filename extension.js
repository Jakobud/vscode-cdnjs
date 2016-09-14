'use strict';

const vscode = require('vscode');
const request = require('request');
const copyPaste = require('copy-paste');
const open = require('open');

function activate(context) {

  const baseUrl = 'https://api.cdnjs.com/libraries';
  const searchUrl = baseUrl + '?fields=version,description,homepage';
  const embedUrl = 'https://cdnjs.cloudflare.com/ajax/libs';

  // Display search box and return input
  let showSearchInput = () => {

    return new Promise((resolve, reject) => {
      vscode.window.showInputBox({
        placeHolder: 'Search for a script or library. For example: jquery'
      }).then((value) => {

        // No search string was specified
        if (typeof(value) === 'undefined') {
          reject("No search string was specified");
          return false;
        }

        resolve(value);

      });
    });
  }

  // Perform search on cdnjs.com and return JSON results
  let search = (term) => {

    return new Promise((resolve, reject) => {

      // TODO: Update the status bar to indicate searching

      // Search cdnjs api
      request(searchUrl + '&search=' + term, (err, res, body) => {

        // TODO: Update the status bar to indicate searching

        // TODO: Need to add error handling here (Promise reject here)
        // for err, res.status != 200 and !body.results

        resolve(JSON.parse(body).results);

      });
    });
  }

  // Show picker of all libraries
  let showLibraryPicker = (results) => {

    // Build array of libraries
    let items = [];
    for (let result of results) {

      // Create QuickPickItem for library
      let item = {
        label: result.name,
        description: result.description,
        currentVersion: result.version,
        name: result.name
      };
      items.push(item);
    }

    return new Promise((resolve, reject) => {

      // Show QuickPick of search results
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a library (' + items.length + ' results)',
        matchOnDescription: true
      }).then(function(libraryName) {

        // No library was chosen
        if (typeof(libraryName) === 'undefined') {
          reject("No library was chosen");
          return false;
        }

        resolve(libraryName);

      });

    });

  }

  // Get library data from cdnjs
  let getLibrary = (libraryName) => {

    return new Promise((resolve, reject) => {

      // TODO: Update the status bar to indicate searching

      // Request library versions
      request(baseUrl + "/" + libraryName, function(err, res, body) {

        // TODO: Update the status bar to indicate searching

        // TODO: error handling

        resolve(JSON.parse(body));
      });

    });
  }

  // Show library version picker
  let showLibraryVersionPicker = (library) => {

    return new Promise((resolve, reject) => {
      // Build array of library versions
      let items = [];
      for (let asset of library.assets) {

        // QuickPickItem for the library version
        let item = {
          label: asset.version,
          files: asset.files,
          version: asset.version
        };

        // Add description if this is the current/latest/stable version
        if (asset.version === library.currentVersion) {
          item.description = 'current version';
        }
        items.push(item);
      }

      // Show QuickPick of library versions
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a version'
      }).then(function(asset) {

        // No version was chosen
        if (typeof(asset) === 'undefined') {
          reject("No library version was chosen");
          return false;
        }

        resolve(asset);
      });
    });
  }

  // Show library version file picker
  let showFilePicker = (asset) => {

    return new Promise((resolve, reject) => {

      // Build array of files
      let items = [];
      for (let file of asset.files) {
        items.push(file);
      }

      // Show QuickPick of asset files
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a file to embed'
      }).then(function(file) {

        // No file was chosen
        if (typeof(file) === 'undefined') {
          reject('No library file was chosen');
          return false;
        }

        resolve(file);
      });


    });

  }

  // Show file action picker
  let showActionPicker = (chosen) => {

    return new Promise((resolve, reject) => {

      // TODO: Add reject here for missing asset properties

      // Build the url for the file
      let url = embedUrl + '/' + chosen.library + '/' + chosen.version + '/' + chosen.file;

      // Arrays of actions
      let actions = [];
      let insertActions = [];
      let clipboardActions = [];

      // Determine file extension
      let fileExtension = chosen.file.split('.').pop();
      switch (fileExtension) {

        case 'js':
          // JavaScript

          // Insert <script> tag into document action
          if (vscode.window.activeTextEditor) {
            insertActions.push({
              label: 'Insert <script> tag into document',
              detail: '<script src="' + url + '"></script>',
              text: '<script src="' + url + '"></script>',
              callback: function(text) {
                insertText(text);
              }
            });
          }

          // Copy <script> tag to clipboard action
          clipboardActions.push({
            label: 'Copy <script> tag to clipboard',
            text: '<script src="' + url + '"></script>',
            callback: function(text) {
              copyPaste.copy(text, function() {
                vscode.window.showInformationMessage('<script> tag has been copied to the clipboard');
              });
            }
          });

          break;

        case 'css':
          // CSS

          // Insert <link> tag into document action
          if (vscode.window.activeTextEditor) {
            insertActions.push({
              label: 'Insert <link> tag into document',
              detail: '<link rel="stylesheet" href="' + url + '"/>',
              text: '<link rel="stylesheet" href="' + url + '"/>',
              callback: function(text) {
                insertText(text);
              }
            });
          }

          // Copy <link> tag to clipboard action
          clipboardActions.push({
            label: 'Copy <link> tag to clipboard',
            text: '<link rel="stylesheet" href="' + url + '"/>',
            callback: function(text) {
              copyPaste.copy(text, function() {
                vscode.window.showInformationMessage('<link> tag has been copied to the clipboard');
              });
            }
          });

          break;

        default:
          break;
      }

      // Insert URL into document action
      if (vscode.window.activeTextEditor) {
        actions.push({
          label: 'Insert URL into document',
          detail: url,
          text: url,
          callback: function(text) {
            insertText(text);
          }
        });
      }

      // Add other insert actions
      actions = actions.concat(insertActions);

      // Copy URL to clipboard action
      actions.push({
        label: 'Copy URL to clipboard',
        text: url,
        callback: function(text) {
          copyPaste.copy(text, function() {
            vscode.window.showInformationMessage('URL has been copied to the clipboard');
          });
        }
      });

      // Add other clipboard actions
      actions = actions.concat(clipboardActions);

      // Open URL in browser action
      actions.push({
        label: 'Open URL in default browser',
        text: url,
        callback: function(text) {
          open(text);
        }
      });

      return new Promise((resolve, reject) => {
        vscode.window.showQuickPick(actions, {
          placeHolder: 'Choose an action'
        }).then(function(action) {

          // No action was chosen
          if (typeof(action) === 'undefined') {
            reject();
          }

          // Execute action callback
          action.callback(action.text);

          resolve();
        });

      });

    });
  }

  var disposable = vscode.commands.registerCommand('cdnjs.search', function() {

    vscode.window.showInputBox({
      placeHolder: 'Search for a script or library. For example: jquery'
    }).then(function(value) {

      // No search string was entered
      if (typeof(value) === 'undefined') {
        return false;
      }

      value = value.trim();

      // TODO: Update the status bar to indicate searching

      // Search cdnjs api
      request(searchUrl + '&search=' + value, function(err, res, body) {

        // TODO: Need to add error handling here
        // for err, res.status != 200 and !body.results

        let results = JSON.parse(body).results;

        // Build array of libraries
        let items = [];
        for (let result of results) {

          // Create QuickPickItem for library
          let item = {
            label: result.name,
            description: result.description,
            currentVersion: result.version,
            name: result.name
          };
          items.push(item);
        }

        // Show QuickPick of search results
        vscode.window.showQuickPick(items, {
          placeHolder: 'Choose a library (' + items.length + ' results)',
          matchOnDescription: true
        }).then(function(library) {

          // No library was chosen
          if (typeof(library) === 'undefined') {
            return false;
          }

          // TODO: Update the status bar to indicate searching

          // Request library versions
          request(baseUrl + "/" + library.name, function(err, res, body) {

            // TODO: error handling

            body = JSON.parse(body);
            let assets = body.assets;

            // Build array of library versions
            let items = [];
            for (let asset of assets) {

              // QuickPickItem for the library version
              let item = {
                label: asset.version,
                files: asset.files,
                version: asset.version,
                description: ''
              };

              // Add description if this is the current/latest/stable version
              if (asset.version === library.currentVersion) {
                item.description = 'current version';
              }
              items.push(item);
            }

            // Show QuickPick of versions
            vscode.window.showQuickPick(items, {
              placeHolder: 'Choose a version'
            }).then(function(asset) {

              // No asset was chosen
              if (typeof(asset) === 'undefined') {
                return false;
              }

              // Build array of asset files
              let items = [];
              for (let file of asset.files) {
                items.push(file);
              }

              // Show QuickPick of asset files
              vscode.window.showQuickPick(items, {
                placeHolder: 'Choose a file to embed'
              }).then(function(file) {

                // No file was chosen
                if (typeof(file) === 'undefined') {
                  return false;
                }

                // Build the url for the file
                let url = embedUrl + '/' + library.name + '/' + asset.version + '/' + file;

                let items = [];

                // Only show Insert actions if there is an active TextEditor
                if (vscode.window.activeTextEditor) {

                  // Insert URL
                  items.push({
                    label: 'Insert URL into document',
                    detail: url,
                    text: url,
                    callback: function(text) {
                      insertText(text);
                    }
                  });

                  // Insert tag
                  switch (file.split('.').pop()) {
                    case 'js':
                      items.push({
                        label: 'Insert <script> tag into document',
                        detail: '<script src="' + url + '"></script>',
                        text: '<script src="' + url + '"></script>',
                        callback: function(text) {
                          insertText(text);
                        }
                      });
                      break;

                    case 'css':
                      items.push({
                        label: 'Insert <link> tag into document',
                        detail: '<link rel="stylesheet" href="' + url + '"/>',
                        text: '<link rel="stylesheet" href="' + url + '"/>',
                        callback: function(text) {
                          insertText(text);
                        }
                      });
                      break;

                    default:
                      break;
                  }

                }

                // Copy URL
                items.push({
                  label: 'Copy URL to clipboard',
                  text: url,
                  callback: function(text) {
                    copyPaste.copy(text, function() {
                      vscode.window.showInformationMessage('URL has been copied to the clipboard');
                    });
                  }
                });

                // Copy tag
                switch (file.split('.').pop()) {
                  case 'js':
                    items.push({
                      label: 'Copy <script> tag to clipboard',
                      text: '<script src="' + url + '"></script>',
                      callback: function(text) {
                        copyPaste.copy(text, function() {
                          vscode.window.showInformationMessage('<script> tag has been copied to the clipboard');
                        });
                      }
                    });
                    break;

                  case 'css':
                    items.push({
                      label: 'Copy <link> tag to clipboard',
                      text: '<link rel="stylesheet" href="' + url + '"/>',
                      callback: function(text) {
                        copyPaste.copy(text, function() {
                          vscode.window.showInformationMessage('<link> tag has been copied to the clipboard');
                        });
                      }
                    });
                    break;

                  default:
                    break;
                }

                // Open URL in browser
                items.push({
                  label: 'Open URL in default browser',
                  text: url,
                  callback: function(text) {
                    open(text);
                  }
                });

                vscode.window.showQuickPick(items, {
                  placeHolder: 'Choose an option'
                }).then(function(option) {

                  // No option was chosen
                  if (typeof(option) === 'undefined') {
                    return false;
                  }

                  // Insert the string into document at cursor position(s)
                  option.callback(option.text);

                  return true;
                });

              });

              return true;
            });

          });

        });

      });

      return true;
    });

  });
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

// Insert text into active document at cursor positions
function insertText(text) {

  let textEditor = vscode.window.activeTextEditor;

  // Ignore if no active TextEditor
  if (typeof(textEditor) === 'undefined') {
    return false;
  }

  // Get the active text document's uri
  let uri = textEditor.document.uri;

  // Create a new TextEdit for each selection
  let edits = [];
  for (let selection of textEditor.selections) {
    edits.push(vscode.TextEdit.insert(selection.active, text));
  }

  // New WorkspaceEdit
  let edit = new vscode.WorkspaceEdit();
  edit.set(uri, edits);

  // Applying the WorkspaceEdit
  vscode.workspace.applyEdit(edit);
}