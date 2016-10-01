'use strict';

const vscode = require('vscode');
const request = require('request');
const copyPaste = require('copy-paste');
const open = require('open');
const Promise = require('bluebird');

let activate = (context) => {

  const baseUrl = 'https://api.cdnjs.com/libraries';
  const searchUrl = baseUrl + '?fields=version,description,homepage';
  const embedUrl = 'cdnjs.cloudflare.com/ajax/libs';
  const statusBarMessageTimeout = 5000; // milliseconds

  // Quote configuration values
  const quotes = {
    'single': "'",
    'double': '"'
  };
  const quoteDefault = "'";

  // Protocol configuration values
  const protocols = ['https://', 'http://', '//'];
  const protocolDefault = 'https://';

  // Set consistent status bar message using timeout with either promise or time in milliseconds
  let statusMessage = (text, promise) => {
    if (promise) {
      vscode.window.setStatusBarMessage("cdnjs: " + text, promise);
    } else {
      vscode.window.setStatusBarMessage("cdnjs: " + text, statusBarMessageTimeout);
    }
  }

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
      request(searchUrl + '&search=' + term.trim(), (err, res, body) => {

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
    statusMessage("Searching for " + term, promise);
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

    // Update status bar message
    statusMessage('Found ' + items.length + ' libraries');

    return new Promise((resolve, reject) => {

      // Show QuickPick of search results
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a library (found' + items.length + ' libraries)',
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
    statusMessage("Fetching data for " + libraryName, promise);
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
          version: asset.version,
          libraryName: library.name
        };

        // Add description if this is the current/latest/stable version
        if (asset.version === library.version) {
          item.description = 'current version';
        }
        items.push(item);
      }

      statusMessage('Found ' + items.length + ' versions');

      // Show QuickPick of library versions
      vscode.window.showQuickPick(items, {
        placeHolder: library.name
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

      statusMessage('Found ' + items.length + ' files');

      // Show QuickPick of asset files
      vscode.window.showQuickPick(items, {
        placeHolder: asset.libraryName + "/" + asset.version + "/"
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

      // Configuration
      const config = vscode.workspace.getConfiguration('cdnjs');

      // Determine the quote style from configuration
      const quote = quotes[config.get('quoteStyle')] || quoteDefault;

      // Determine url protocol
      const protocolConfig = config.get('protocol');
      const protocol = protocols.indexOf(protocolConfig) >= 0 ? protocolConfig : protocolDefault;

      // Build the url for the file
      let url = protocol + embedUrl + '/' + chosen.library + '/' + chosen.version + '/' + chosen.file;

      // Arrays of actions
      let actions = [];
      let insertActions = [];
      let clipboardActions = [];

      // Determine file extension
      let fileExtension = chosen.file.split('.').pop();
      let tag = "";
      switch (fileExtension) {

        case 'js':
          // JavaScript
          tag = '<script src=' + quote + url + quote + '></script>';

          // Insert <script> tag into document action
          if (vscode.window.activeTextEditor) {
            insertActions.push({
              label: 'Insert <script> tag into document',
              callback: () => {
                insertText(tag);
              }
            });
          }

          // Copy <script> tag to clipboard action
          clipboardActions.push({
            label: 'Copy <script> tag to clipboard',
            callback: () => {
              copy(tag, '<script> tag copied to the clipboard');
            }
          });

          break;

        case 'css':
          // CSS
          tag = '<link rel=' + quote + 'stylesheet' + quote + ' href=' + quote + url + quote + '/>';

          // Insert <link> tag into document action
          if (vscode.window.activeTextEditor) {
            insertActions.push({
              label: 'Insert <link> tag into document',
              callback: () => {
                insertText(tag);
              }
            });
          }

          // Copy <link> tag to clipboard action
          clipboardActions.push({
            label: 'Copy <link> tag to clipboard',
            callback: () => {
              copy(tag, '<link> tag copied to the clipboard');
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
          copy(url, 'URL copied to the clipboard');
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
          placeHolder: url
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
    vscode.workspace.applyEdit(edit)
      .then(() => {

        // Clear the selection
        textEditor.selection = new vscode.Selection(textEditor.selection.end, textEditor.selection.end);

      }, (err) => {
        reject(err);
      });

    return true;
  }

  // Copy text to clipboard and set statusBarMessage
  let copy = (text, message) => {
    copyPaste.copy(text, () => {
      if (message) {
        statusMessage(message);
      }
    });
  }

  let searchDisposable = vscode.commands.registerCommand('cdnjs.search', function() {

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

  let recentLibrariesDisposable = vscode.commands.registerCommand('cdnjs.recentLibraries', function() {
    console.log('recentLibraries');
  });
}
exports.activate = activate;

let deactivate = () => {}
exports.deactivate = deactivate;