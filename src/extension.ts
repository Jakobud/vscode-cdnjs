/// <reference path="../typings/all.d.ts" />

'use strict';

import * as vscode from 'vscode';
import * as request from 'request';

export function activate(context: vscode.ExtensionContext) {

  const baseUrl = 'https://api.cdnjs.com/libraries';
  const searchUrl = baseUrl + '?fields=version,description,homepage';
  const embedUrl = 'https://cdnjs.cloudflare.com/ajax/libs';

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

          // Create QuickPickItem for library
          let item: vscode.QuickPickItem = {
            label: result.name,
            description: result.description,
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

              // QuickPickItem for the library version
              let item: vscode.QuickPickItem = {
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

            // Show QuickPick of versions
            vscode.window.showQuickPick(items, {
              placeHolder: 'Choose a version'
            }).then((asset) => {

              // Build array of asset files
              let items = [];
              for (let file of asset.files) {
                items.push(file);
              }

              // Show QuickPick of asset files
              vscode.window.showQuickPick(items, {
                placeHolder: 'Choose a file to embed'
              }).then((file) {
                console.log(embedUrl + '/' + library.name + '/' + asset.version + '/' + file);

                let items = [
                  'Insert URL'
                ];
                switch (file.split('.').pop()) {
                  case 'js':
                    items.push('Insert <script> tag');
                    break;

                  case 'css':
                    items.push('Insert <link> tag');

                  default:
                    break;
                }

                vscode.window.showQuickPick(items, {
                  placeHolder: 'Choose an option'
                }).then((value) => {
                  console.log(value);

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

  context.subscriptions.push(disposable);
}

export function deactivate() {}