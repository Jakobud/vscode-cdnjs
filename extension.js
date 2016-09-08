var vscode = require('vscode');
var request = require('request');
var Promise = require('bluebird');

function activate(context) {

    // cdnjs.com api endpoint
    var url = 'https://api.cdnjs.com/libraries';

    var disposable = vscode.commands.registerCommand('cdnjs.cdnjs', function() {

        var window = vscode.window;

        // Show search box
        window.showInputBox({
                'placeHolder': 'Search for a library, for example: jquery'
            })
            .then(function(value) {

                return new Promise(function(resolve, reject) {

                    // Search cdnjs api
                    request(url + '?search=' + value, function(err, res, body) {

                        // TODO: Need to add error handling here
                        // for err, res.status != 200 and !body.results

                        var results = JSON.parse(body).results;
                        var pickItems = [];

                        // Sort through the results
                        for (var index in results) {
                            if (results.hasOwnProperty(index)) {
                                var element = results[index];
                                if (element.name) {
                                    pickItems.push(element.name);
                                }
                            }
                        }
                        resolve(pickItems);
                    })
                })
            })
            .then(function(pickItems) {

                // Show a QuickPickBox of the search results
                return new Promise(function(resolve, reject) {

                    window.showQuickPick(pickItems, {
                            'placeHolder': "Results found: " + pickItems.length
                        })
                        .then(function(value) {
                            resolve(value);
                        });
                });

            })
            .then(function(value) {
                console.log(value);
            }).catch(function(e) {
                // TODO: Add proper Promise rejection handling
                console.log(e);
            })


    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;