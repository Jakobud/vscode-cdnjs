'use strict';

const vscode = require('vscode');
let request = null;
let copyPaste = null;
let open = null;
const Promise = require('bluebird');
const RecentLibraries = require('./RecentLibraries');
const Cache = require('./Cache');

let activate = (context) => {

  const baseUrl = 'https://api.cdnjs.com/libraries';
  const searchUrl = baseUrl + '?fields=version,description,homepage';
  const embedUrl = 'cdnjs.cloudflare.com/ajax/libs';
  const statusBarMessageTimeout = 5000; // 5 seconds
  const cacheExpiration = 21600 // 6 hours

  // Quote configuration values
  const quotes = {
    'single': "'",
    'double': '"'
  };
  const quoteDefault = "'";

  // Protocol configuration values
  const protocols = ['https://', 'http://', '//'];
  const protocolDefault = 'https://';

  // Maximum Recent Libraries configuration values
  const maxRecentLibrariesDefault = 10;

  // Recent Libraries interface
  let recentLibraries = new RecentLibraries(context, vscode.workspace);

  // Cache interfaces
  let searchCache = new Cache(context, 'search');
  let libraryCache = new Cache(context, 'library');

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
          return reject('No search string was specified');
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

      // Ignore empty searches
      if (!term.trim().length) {
        return reject('No search term provided');
      }

      // Check the cache
      if (searchCache.has(term)) {
        return resolve(searchCache.get(term));
      }

      // Lazy load request
      request = require('request');

      // Search cdnjs api
      request(searchUrl + '&search=' + term.trim(), (err, res, body) => {

        // Reject errors
        if (err) {
          return reject(err);
        }

        // Reject non-200 status code responses
        if (res.statusCode !== 200) {
          return reject(body);
        }

        body = JSON.parse(body);

        // Display error message if no results were found
        if (!body.results || body.results.length === 0) {
          vscode.window.showErrorMessage("No libraries were found by the search term: " + term);
          return false;
        }

        // Save the result to cache and resolving the search result
        searchCache.put(term, body.results, cacheExpiration)
          .then(() => {
            resolve(body.results);
          }, (err) => {
            reject(err);
          });

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
          return reject('No library was chosen');
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

      // Lazy load request
      request = require('request');

      // Request library versions
      request(baseUrl + '/' + libraryName, (err, res, body) => {

        // Reject errors
        if (err) {
          return reject(err);
        }

        // Reject non-200 status code responses
        if (res.statusCode !== 200) {
          return reject(body);
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
          return reject('No library version was chosen');
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
          return reject('No library file was chosen');
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
        return reject('Missing file asset parameters');
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

      // Determine file extension
      let fileExtension = chosen.file.split('.').pop();
      let tag = "";
      switch (fileExtension) {

        case 'js':
          // JavaScript
          tag = '<script src=' + quote + url + quote + '></script>';

          // Insert <script> tag into document action
          if (vscode.window.activeTextEditor) {
            actions.push({
              label: '<script>: Insert into document',
              callback: () => {
                insertText(tag);
              }
            });
          }

          // Copy <script> tag to clipboard action
          actions.push({
            label: '<script>: Copy to clipboard',
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
            actions.push({
              label: '<link>: Insert into document',
              callback: () => {
                insertText(tag);
              }
            });
          }

          // Copy <link> tag to clipboard action
          actions.push({
            label: '<link>: Copy to clipboard',
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
          label: 'URL: Insert into document',
          callback: () => {
            insertText(url);
          }
        });
      }

      // Copy URL to clipboard action
      actions.push({
        label: 'URL: Copy to clipboard',
        callback: () => {
          copy(url, 'URL copied to the clipboard');
        }
      });

      // Open URL in browser action
      actions.push({
        label: 'URL: Open in browser',
        callback: () => {
          // Lazy load open
          open = require('open');

          open(url);
        }
      });

      return new Promise((resolve, reject) => {
        vscode.window.showQuickPick(actions, {
          placeHolder: url
        }).then((action) => {

          // No action was chosen
          if (typeof(action) === 'undefined') {
            return reject('No action was chosen');
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
    // Lazy load copy-paste
    copyPaste = require('copy-paste');

    copyPaste.copy(text, () => {
      if (message) {
        statusMessage(message);
      }
    });
  }

  let searchDisposable = vscode.commands.registerCommand('cdnjs.search', () => {

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

      recentLibraries.add(asset);

      return showFilePicker(asset);

    }).then((file) => {

      chosen.file = file;

      return showActionPicker(chosen);

    }).catch((err) => {

      console.error(err);

    });

  });

  let recentLibrariesDisposable = vscode.commands.registerCommand('cdnjs.recentLibraries', () => {

    let chosen = {};

    new Promise((resolve, reject) => {

      // Build array of recent libraries
      let items = [];
      for (let library of recentLibraries.get()) {
        items.push({
          label: library.libraryName + '/' + library.version,
          asset: library
        });
      }

      // Show quick pick of recent libraries
      vscode.window.showQuickPick(items, {
        placeHolder: 'Choose a recent library'
      }).then((library) => {

        // No recent library was chosen
        if (typeof(library) === 'undefined') {
          return reject('No library was chosen');
        }

        resolve(library.asset);

      }, (err) => {
        reject(err);
      });

    }).then((asset) => {

      // Set the chosen file's library and version'
      chosen.library = asset.libraryName;
      chosen.version = asset.version;

      recentLibraries.add(asset);

      return showFilePicker(asset);

    }).then((file) => {

      chosen.file = file;

      return showActionPicker(chosen);

    }).catch((err) => {

      console.error(err);

    });

  });
}
exports.activate = activate;

let deactivate = () => {}
exports.deactivate = deactivate;