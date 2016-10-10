'use strict';

let RecentLibraries = function(context, workspace) {

  this.context = context;
  this.workspace = workspace;
  this.libraries = this.context.globalState.get('recentLibraries', []);

}

RecentLibraries.prototype.add = function(newLibrary) {
  // Remove library if it already exists in array
  for (let index in this.libraries) {

    // Match found, remove it from the array
    if (newLibrary.libraryName === this.libraries[index].libraryName && newLibrary.version === this.libraries[index].version) {
      this.libraries.splice(index, 1);
      break;
    }

  }
  // Add new library to the front of the array
  this.libraries.unshift(newLibrary);

  // Limit to maxium number of recent libraries according to configuration
  const max = this.workspace.getConfiguration('cdnjs').get('maxRecentLibraries');
  if (Number.isInteger(max) === true && max >= 1) {
    this.libraries = this.libraries.slice(0, max);
  } else {
    this.libraries = this.libraries.slice(0, maxRecentLibrariesDefault);
  }

  return this.context.globalState.update('recentLibraries', this.libraries);
}

RecentLibraries.prototype.get = function() {
  return this.libraries;
}

RecentLibraries.prototype.clear = function() {
  this.libraries = [];
  return this.context.globalState.update('recentLibraries', this.libraries);
}

module.exports = RecentLibraries;