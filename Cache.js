'use strict';

/**
 * @module Cache
 * @desc
 * @class
 * @param {ExtensionContext} context - The Visual Studio Code extension context
 * @param {string} [name] - Optional name for the cache. Defaults to "cache"
 * @returns {Cache} The cache object
 */
let Cache = function (context, name) {
  if (!context) {
    return undefined;
  }

  this.context = context;
  this.name = name || 'cache';
  this.cache = this.context.globalState.get(this.name, {});
}

/**
 * @name cache.set
 * @desc Save something in the cache, with optional expiration
 * @function
 * @param {string} key - The unique key for the cached item
 * @param {string|number|object} value - The value to cache
 * @param {number} [expiration] - Optional expiration time in seconds
 * @returns {Thenable} Visual Studio Code Thenable (Promise)
 */
Cache.prototype.set = function (key, value, expiration) {

  // Parameter type checking
  if (typeof (key) !== 'string' || typeof (value) === 'undefined') {
    return undefined;
  }

  let obj = {
    value: value
  };

  // Set expiration
  if (Number.isInteger(expiration) === true) {
    obj.expiration = expiration;
  }

  this.cache[key] = obj;

  // TODO: Save to global state
}

/**
 * @name cache.get
 * @desc Get something from the cache, or the optional default value
 * @function
 * @param {string} key - The unique key for the cached item
 * @param {string|number|object} [defaultValue] - The optional default value to return if the cached item does not exist or is expired
 * @returns {string|number|object} Returns the cached value or optional defaultValue
 */
Cache.prototype.get = function (key, defaultValue) {

  // Make sure key is a string
  if (typeof (key) !== 'string') {
    return undefined;
  }

  if (typeof (this.cache[key]) === 'undefined') {

    // Return default value if undefined
    if (typeof (defaultValue) !== 'undefined') {
      return defaultValue;

      // Return undefined
    } else {
      return undefined;
    }
  }

  // if (typeof (this.))
}

/**
 * @name cache.has
 * @desc Checks to see if cached item exists
 * @function
 * @param {string} key - The unique key for the cached item
 * @return {boolean}
 */
Cache.prototype.has = function (key) {
  if (typeof (key) !== 'string') {
    return undefined;
  }
  return (typeof (this.cache[key]) !== 'undefined' && !this.isExpired(key));
}

/**
 * @name cache.remove
 * @desc Removes the cached item from the cache
 * @function
 * @param {string} key - The unique key for the cached item
 * @returns {Thenable} Visual Studio Code Thenable (Promise)
 */
Cache.prototype.remove = function (key) {
  if (typeof (key) !== 'string') {
    return undefined;
  }

  // Update globalState
}

/**
 * @name cache.keys
 * @desc Get an array of all cached item keys
 * @function
 * @return {string[]}
 */
Cache.prototype.keys = function () {
  return Object.keys(this.cache);
}

/**
 * @name cache.clear
 * @desc Clears all items from the cache
 * @function
 * @return {boolean}
 */
Cache.prototype.clear = function () {
  return this.cache = {};
  // Need to update the globalState as well
}

/**
 * @name cache.expiration
 * @desc Gets the expiration time for the cached item
 * @function
 * @param {string} key - The unique key for the cached item
 * @return {number} Unix Timestamp in seconds
 */
Cache.prototype.expiration = function (key) {
  if (!this.has(key)) {
    return undefined;
  }
  return this.get(key).expiration;
}

/**
 * @name isExpired
 * @desc Checks to see if cached item is expired
 * @function
 * @private
 * @param {string} key - The unique key for the cached item
 * @return {boolean}
 */
var isExpired = function (key) {
  console.log('in isexpired now');
}

module.exports = Cache;