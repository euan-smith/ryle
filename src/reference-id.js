/**
 * Created by euans on 29/01/2017.
 */

// The count of references assigned
var id=0;

// The property in which to store an object's reference ID
const sym=Symbol?Symbol():"_$$refId";

/**
 * Check if and ID can be added
 * @param {Object} obj
 * @returns {boolean}
 */
function checkCanId(obj){
 if (!(obj instanceof Object)) throw new TypeError('Reference IDs can only be applied to types derived from Object');
}

module.exports={
  /**
   * Return an id for the object, assigning one if necessary.
   * @param {Object} obj the object for which an ID is needed.
   * @returns {number} The reference ID of the supplied object
   */
  ensureId(obj){
    checkCanId(obj);
    return obj[sym] || (obj[sym] = ++id);
  },

  /**
   * Return the reference id of the object.
   * @param {Object} obj the object for which an ID is needed.
   * @returns {number|undefined} The reference ID of the supplied object or undefined if there is none
   */
  getId(obj){
    checkCanId(obj);
    return obj[sym];
  },

  /**
   * Checks if an object has a reference ID
    * @param {Object} obj the object to test
   * @returns {boolean}
   */
  hasId(obj){
    checkCanId(obj);
    return !!obj[sym];
  }
};