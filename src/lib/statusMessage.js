'use strict';

import vscode from 'vscode';
import settings from '../settings';

// Set consistent status bar message using timeout with either promise or time in milliseconds
export default (text, promise) => {
  if (promise) {
    vscode.window.setStatusBarMessage('cdnjs: ' + text, promise);
  } else {
    vscode.window.setStatusBarMessage('cdnjs: ' + text, settings.statusBarMessageTimeout);
  }
};
