'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "someext" is now active!');

    let disposable = vscode.commands.registerCommand('cdnjs.cdnjs', () => {

    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}