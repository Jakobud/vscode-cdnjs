var vscode = require('vscode');

function activate(context) {

    var disposable = vscode.commands.registerCommand('cdnjs.cdnjs', function() {

        var window = vscode.window;

        console.log('test');

    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;