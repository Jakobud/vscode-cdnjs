'use strict';

import * as vscode from 'vscode';

let settings = {};

settings.baseUrl = 'https://api.cdnjs.com/libraries';
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
  'react',
  'angular',
  'vue',
  'jquery',
  'backbone',
  'ember',
  'svelte',
  'd3',
  'lodash',
  'underscore',
  'bootstrap',
  'moment',
  'axios',
  'redux',
  'rxjs',
  'three',
  'chartjs',
  'animejs',
  'pixi',
  'gsap',
  'leaflet',
  'knockout',
  'slick-carousel',
  'videojs',
  'popper',
  'semantic-ui',
  'foundation',
  'materialize',
  'bulma',
  'tailwindcss',
  'uikit',
  'purecss',
  'milligram',
  'spectre',
  'tachyons',
  'animate.css',
  'aos',
  'scrollreveal',
  'wowjs',
  'fullpage',
  'parallax',
  'isotope',
  'masonry',
  'packery',
  'flickity',
  'swiper',
  'owl.carousel',
  'lightbox2',
  'photoswipe',
  'magnific-popup',
  'sweetalert',
  'toastr',
  'noty',
  'pnotify',
  'alertify',
  'bootbox',
  'iziToast',
  'notifyjs',
  'growl',
  'gritter',
  'humane',
  'messenger',
  'notie',
  'smoke',
  'vex',
  'alertifyjs',
  'notyf',
  'iziModal',
  'sweetalert2'
];

export default settings;