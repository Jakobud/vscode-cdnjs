'use strict';

const vscode = require('vscode');
const request = require('request');
const copyPaste = require('copy-paste');
const open = require('open');

let activate = (context) => {

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
          reject('No search string was specified');
          return false;
        }

        resolve(value);

      }, (err) => {
        reject(err);
      });
    });
  }

  // Perform search on cdnjs.com and return JSON results
  let search = (term) => {

    let promise = new Promise((resolve, reject) => {

      // Search cdnjs api
      request(searchUrl + '&search=' + term, (err, res, body) => {

        // Reject errors
        if (err) {
          reject(err);
          return false;
        }

        // Reject non-200 status code responses
        if (res.statusCode !== 200) {
          reject(body);
          return false;
        }

        body = JSON.parse(body);

        // Display error message if no results were found
        if (!body.results || body.results.length === 0) {
          vscode.window.showErrorMessage("No libraries were found by the search term: " + term);
          return false;
        }

        resolve(body.results);

      });
    });

    // Update Status Bar Message
    vscode.window.setStatusBarMessage("Searching cdnjs.com", promise);
    return promise;
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
      }).then((libraryName) => {

        // No library was chosen
        if (typeof(libraryName) === 'undefined') {
          reject('No library was chosen');
          return false;
        }

        resolve(libraryName);

      }, (err) => {
        reject(err);
      });

    });

  }

  // Get library data from cdnjs
  let getLibrary = (libraryName) => {

    let promise = new Promise((resolve, reject) => {

      // Request library versions
      request(baseUrl + '/' + libraryName, (err, res, body) => {

        // Reject errors
        if (err) {
          reject(err);
          return false;
        }

        // Reject non-200 status code responses
        if (res.statusCode !== 200) {
          reject(body);
          return false;
        }

        body = JSON.parse(body);

        // Display error message if no results were found
        if (body.length === 0) {
          vscode.window.showErrorMessage("The library " + libraryName + " was not found");
          return false;
        }

        resolve(body);
      });

    });

    // Update Status Bar Message
    vscode.window.setStatusBarMessage("Fetching data for " + libraryName, promise);
    return promise;
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
        if (asset.version === library.version) {
          item.description = 'current version';
        }
        items.push(item);
      }

      // Show QuickPick of library versions
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a version'
      }).then((asset) => {

        // No version was chosen
        if (typeof(asset) === 'undefined') {
          reject('No library version was chosen');
          return false;
        }

        resolve(asset);
      }, (err) => {
        reject(err);
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
      }).then((file) => {

        // No file was chosen
        if (typeof(file) === 'undefined') {
          reject('No library file was chosen');
          return false;
        }

        resolve(file);
      }, (err) => {
        reject(err);
      });


    });

  }

  // Show file action picker
  let showActionPicker = (chosen) => {

    return new Promise((resolve, reject) => {

      // Reject if any chosen file properties are missing
      if (!chosen.library || !chosen.version || !chosen.file) {
        reject('Missing file asset parameters');
        return false;
      }

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
            let tag = '<script src="' + url + '"></script>';
            insertActions.push({
              label: 'Insert <script> tag into document',
              detail: tag,
              callback: () => {
                insertText(tag);
              }
            });
          }

          // Copy <script> tag to clipboard action
          clipboardActions.push({
            label: 'Copy <script> tag to clipboard',
            callback: () => {
              copyJavaScript(url);
            }
          });

          break;

        case 'css':
          // CSS

          // Insert <link> tag into document action
          if (vscode.window.activeTextEditor) {
            let tag = '<link rel="stylesheet" href="' + url + '"/>';
            insertActions.push({
              label: 'Insert <link> tag into document',
              detail: tag,
              callback: () => {
                insertText(tag);
              }
            });
          }

          // Copy <link> tag to clipboard action
          clipboardActions.push({
            label: 'Copy <link> tag to clipboard',
            callback: () => {
              copyCss(url);
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
          callback: () => {
            insertText(url);
          }
        });
      }

      // Add other insert actions
      actions = actions.concat(insertActions);

      // Copy URL to clipboard action
      actions.push({
        label: 'Copy URL to clipboard',
        callback: () => {
          copyUrl(url);
        }
      });

      // Add other clipboard actions
      actions = actions.concat(clipboardActions);

      // Open URL in browser action
      actions.push({
        label: 'Open URL in default browser',
        callback: () => {
          open(url);
        }
      });

      return new Promise((resolve, reject) => {
        vscode.window.showQuickPick(actions, {
          placeHolder: 'Choose an action'
        }).then((action) => {

          // No action was chosen
          if (typeof(action) === 'undefined') {
            reject('No action was chosen');
            return false;
          }

          // Execute action callback
          action.callback();

          resolve();
        }, (err) => {
          reject(err);
        });

      });

    });
  }

  // Insert text into active document at cursor positions
  let insertText = (text) => {

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

    return true;
  }

  // Copy URL to clipboard
  let copyUrl = (url) => {
    copyPaste.copy(url, () => {
      vscode.window.showInformationMessage('URL has been copied to the clipboard');
    });
  }

  // Copy script tag to clipboard
  let copyJavaScript = (url) => {
    copyPaste.copy('<script src="' + url + '"></script>', () => {
      vscode.window.showInformationMessage('<script> tag has been copied to the clipboard');
    });
  }

  // Copy link tag to clipboard
  let copyCss = (url, message) => {
    copyPaste.copy('<link rel="stylesheet" href="' + url + '"/>', () => {
      vscode.window.showInformationMessage('<link> tag has been copied to the clipboard');
    });
  }

  let disposable = vscode.commands.registerCommand('cdnjs.search', function() {

    // The chosen file
    let chosen = {};

    showSearchInput().then((value) => {

      return search(value);

    }).then((results) => {

      return showLibraryPicker(results);

    }).then((library) => {

      chosen.library = library.name;

      return getLibrary(library.name);

    }).then((library) => {

      return showLibraryVersionPicker(library);

    }).then((asset) => {

      chosen.version = asset.version;

      return showFilePicker(asset);

    }).then((file) => {

      chosen.file = file;

      return showActionPicker(chosen);

    }).catch((err) => {

      console.error(err);

    })

  });
}
exports.activate = activate;

let deactivate = () => {}
exports.deactivate = deactivate;
