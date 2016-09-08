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
      })
      .then(function(value) {

        // TODO: Handle undefined value

        // Search cdnjs api
        request(url + '?search=' + value, function(err, res, body) {

          // TODO: Need to add error handling here
          // for err, res.status != 200 and !body.results

          var results = JSON.parse(body).results;

          // Build array of search result values
          var pickItems = [];
          for (var index in results) {
            if (results.hasOwnProperty(index)) {
              var element = results[index];
              if (element.name) {
                pickItems.push(element.name);
              }
            }
          }

          // Show QuickPick of search results
          window.showQuickPick(pickItems, {
              'placeHolder': "Results found: " + pickItems.length
            })
            .then(function(library) {

              // Request library versions
              request(url + "/" + library, function(err, res, body) {

                // TODO: error handling

                var body = JSON.parse(body);
                var assets = body.assets;
                var currentVersion = body.version || null;

                console.log(currentVersion);

                // Build array of library versions
                var pickItems = [];
                for (var index in assets) {
                  if (assets.hasOwnProperty(index)) {
                    var element = assets[index];
                    pickItems.push(element.version);
                  }
                }

                // Show QuickPick of library versions
                window.showQuickPick(pickItems, {
                    'placeHolder': "Pick a version"
                  })
                  .then(function(version) {
                    console.log(version);
                  });

              });

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