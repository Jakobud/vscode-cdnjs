'use strict';

import * as vscode from 'vscode';

// Determine if there is an active text editor that is not part of the output panel
export default () => {
  return (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri !== 'output');
};
