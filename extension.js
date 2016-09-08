var vscode = require('vscode');
var request = require('request');

function activate(context) {

    // cdnjs.com api endpoint
    var url = 'https://api.cdnjs.com/libraries';

    var disposable = vscode.commands.registerCommand('cdnjs.cdnjs', function() {

        var window = vscode.window;

        // Show search box
        window.showInputBox({
            'placeHolder': 'Search for a library, for example: jquery'
        }).then(function(value) {

            // Search the cdnjs api
            request(url + '?search=' + value, function(err, res, body) {

                // TODO: Need to add error handling here
                // for err, res.status != 200 and !body.results

                var results = JSON.parse(body).results;
                var pickItems = [];

                for (var index in results) {
                    if (results.hasOwnProperty(index)) {
                        var element = results[index];
                        if (element.name) {
                            pickItems.push(element.name);
                        }
                    }
                }

                window.showQuickPick(pickItems, {
                        'placeHolder': "Results found: " + results.length
                    })
                    .then(function(value) {
                        console.log(value);
                    });


            });
        });




    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;