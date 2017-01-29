/**
 * Created by euans on 29/01/2017.
 */

const rId = require('./reference-id');

class RefStore{
  /**
   * Create an object reference store, optionally for a specified object type.
   * @param {Constructor} type The constructor defining the allowed object type (e.g. Function)
   */
  constructor(type){
    if (!(type instanceof Object)) throw new TypeError('RefStore: The store type must be derived from Object');
    this._store={};
    this.type=type || Object;
  }

  /**
   * Check if an object is of the correct type and return the reference ID if so.
   * @param {Object} obj The object to test
   * @returns {number} The id of the obejct
   * @private
   */
  _checkId(obj){
    if (!(obj instanceof this.type)) throw new TypeError('RefStore: The object type does not match the store type.');
    return rId.ensureId(obj);
  }

  /**
   * Add an object to the store
   * @param {Object} obj The object to be added
   */
  add(obj){
    this._store[this._checkId(obj)]=obj;
  }

  /**
   * Returns true if the obejct is contained in the store
   * @param {Object} obj The object to check
   * @returns {boolean}
   */
  contains(obj){
    return !!this._store[this._checkId(obj)];
  }

  /**
   * Remove the object from the store
   * @param {Object} obj The object to remove
   */
  remove(obj){
    this._store[this._checkId(obj)]=undefined;
  }

  /**
   * Execute a function on every object in the store
   * @param {Function} fn The function to execute
   */
  forEach(fn){
    for (let k of Object.keys(this._store)) {
      if (this._store[k]) {
        fn(this._store[k]);
      }
    }
  }
}