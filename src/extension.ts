/// <reference path="../typings/all.d.ts" />

'use strict';

import * as vscode from 'vscode';
import * as request from 'request';

export function activate(context: vscode.ExtensionContext) {

  const url = 'https://api.cdnjs.com/libraries';

  let disposable = vscode.commands.registerCommand('cdnjs.cdnjs', () => {

    vscode.window.showInputBox({
      'placeHolder': 'Search for a script or library'
    }).then((value) => {

      // TODO: Handle undefined value

      // Search cdnjs api
      request(url + "?search=" + value, (err, res, body) => {

        // TODO: Need to add error handling here
        // for err, res.status != 200 and !body.results

        let results = JSON.parse(body).results;

        // Build array of search result values
        let pickItems = [];
        for (let result of results) {
          pickItems.push(result.name);
        }

        // Show QuickPick of search results
        vscode.window.showQuickPick(pickItems, {
            'placeHolder': "Results found: " + pickItems.length
          })
          .then((library) => {

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
                })
                .then((version) => {
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