/// <reference path="../typings/all.d.ts" />

'use strict';

import * as vscode from 'vscode';
import * as request from 'request';

export function activate(context: vscode.ExtensionContext) {

  const baseUrl = 'https://api.cdnjs.com/libraries';
  const searchUrl = baseUrl + '?fields=version,description,homepage';

  let disposable = vscode.commands.registerCommand('cdnjs.search', () => {

    vscode.window.showInputBox({
      placeHolder: 'Type in the name of a library, i.e. jquery'
    }).then((value) => {

      // No search string was entered
      if (typeof(value) === 'undefined') {
        return false;
      }

      // TODO: handle search string consisting of only spaces

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
            label: result.name,
            description: result.version,
            detail: detail,
            currentVersion: result.version,
            name: result.name
          };
          items.push(item);
        }

        // Show QuickPick of search results
        vscode.window.showQuickPick(items, {
          placeHolder: 'Choose a library (' + items.length + ' results)'
        }).then((library) => {

          // No library was chosen
          if (typeof(library) === 'undefined') {
            return false;
          }

          // Request library versions
          request(baseUrl + "/" + library.name, (err, res, body) => {

            // TODO: error handling

            body = JSON.parse(body);
            let assets = body.assets;

            // Build array of library versions
            let items = [];
            for (let asset of assets) {

              let item: vscode.QuickPickItem = {
                label: asset.version,
                files: asset.files,
                version: asset.version
              };
              if (asset.version === library.currentVersion) {
                item.description = "current version";
              }

              items.push(item);
            }

            // Show QuickPick of library versions
            vscode.window.showQuickPick(items, {
              placeHolder: "Pick a version"
            }).then((asset) => {

              console.log(asset);

              return true;
            });

          });

        });

      });

      return true;
    });


  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}