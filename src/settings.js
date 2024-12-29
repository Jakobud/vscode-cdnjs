'use strict';

import * as vscode from 'vscode';

let settings = {};

settings.baseUrl = 'https://api.cdnjs.com/libraries';
settings.searchUrl = settings.baseUrl + '?fields=version,description,homepage';
settings.embedUrl = 'cdnjs.cloudflare.com/ajax/libs';
settings.httpRequestTimeout = 5000;
settings.statusBarMessageTimeout = 5000;
settings.config = vscode.workspace.getConfiguration('cdnjs');
settings.quoteStyles = {
  'single': "'",
  'double': '"'
};
settings.protocols = ['https://', 'http://', '//'];
settings.context = null;

settings.searchPlaceholders = [
  'jquery',
  'bootstrap',
  'angular',
  'react',
  'leaflet',
  'backbone',
  'd3',
  'ember',
  'slick',
  'knockout',
  'lodash',
  'vue'
];

export default settings;
