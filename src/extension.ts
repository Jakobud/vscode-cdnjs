/// <reference path="../typings/all.d.ts" />

'use strict';

import * as vscode from 'vscode';
import * as request from 'request';

export function activate(context: vscode.ExtensionContext) {

  const baseUrl = 'https://api.cdnjs.com/libraries';
  const searchUrl = baseUrl + '?fields=version,description,homepage';

  let disposable = vscode.commands.registerCommand('cdnjs.search', () => {

    vscode.window.showInputBox({
      'placeHolder': 'Type in the name of a library, i.e. jquery'
    }).then((value) => {

      // No search string was entered
      if (typeof(value) === 'undefined') {
        return false;
      }

      // Search cdnjs api
      request(searchUrl + '&search=' + value, (err, res, body) => {

        // TODO: Need to add error handling here
        // for err, res.status != 200 and !body.results

        let results = JSON.parse(body).results;

        // Build array of libraries
        let items = [];
        for (let result of results) {

          // Build the detail string
          let detail = result.description;
          if (result.homepage) {
            detail += ' (' + result.homepage + ')';
          }

          // Create QuickPickItem
          let item: vscode.QuickPickItem = {
            'label': result.name,
            'description': result.version,
            'detail': detail
          };
          items.push(item);
        }

        // Show QuickPick of search results
        vscode.window.showQuickPick(items, {
          'placeHolder': 'Choose a library (' + items.length + ' results)'
        }).then((library) => {

          // No library was chosen
          if (typeof(library) === 'undefined') {
            return false;
          }

          // Request library versions
          request(url + "/" + library, (err, res, body) => {

            // TODO: error handling

            body = JSON.parse(body);
            let assets = body.assets;
            let currentVersion = body.version || null;

            // Build array of library versions
            let pickItems = [];
            for (let asset of assets) {
              pickItems.push(asset.version);
            }

            // Show QuickPick of library versions
            vscode.window.showQuickPick(pickItems, {
              'placeHolder': "Pick a version"
            }).then((version) => {
              console.log(version);
            });

          });

        });

      });

    });


  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}