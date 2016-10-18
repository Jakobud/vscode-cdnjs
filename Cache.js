'use strict';

let Cache = function(context, key) {
  this.context = context;
  this.key = key || 'cache';
  this.cache = this.context.globalState.get(this.key, {});
}

Cache.prototype.set = function(key, value, expiration) {
  // Type check key
  // Type check value

  let obj = {
    value: value
  };

  // Set expiration if it's an integer
  if (Number.isInteger(expiration) === true) {
    obj.expiration = expiration;
  }

  this.cache[key] = obj;
}

Cache.prototype.get = function(key, defaultValue) {

  // Make sure key is a string
  if (typeof(key) !== 'string') {
    return undefined;
  }

  if (typeof(this.cache[key]) === 'undefined') {

    // Return default value if undefined
    if (typeof(defaultValue) !== 'undefined') {
      return defaultValue;

      // Return undefined
    } else {
      return undefined;
    }
  }

  if (typeof(this.))
}

module.exports = Cache;