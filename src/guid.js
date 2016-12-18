/**
 * Created by EuanSmith on 20/04/2016.
 */
/**
 * This is based on http://dean.edwards.name/weblog/2005/10/add-event/ which is, for example, the approach
 * taken by jQuery
 */


var each = require('./objects').each;

function GUIDFactory(name) {
  var guid = 1;

  function ensureGUID(fn) {
    return fn[name] || (fn[name] = guid++);
  }

  function getGUID(fn) {
    return fn && fn[name];
  }

  function add(store, obj) {
    if (!store.hasOwnProperty('count')) {
      Object.defineProperty(store, 'count', {value: 0, enumerable: false, writable: true});
    }
    var objGUID = ensureGUID(obj);
    if (!store.hasOwnProperty(objGUID))store.count++;
    store[objGUID] = obj;
    return obj;
  }

  function present(store, obj) {
    return !!(obj[name] && store[ensureGUID(obj)]);
  }

  //NOTE: think about doing the store in an alternative way with a custom store iterator rather than assuming
  //that it is a general object - with delete it won't perform well in V8, although that won't matter most
  //of the time.  Sparse arrays (as the guids are integers) may be the way to go.
  function remove(store, obj) {
    var objGUID = getGUID(obj);
    if (store.hasOwnProperty(objGUID)) {
      store.count--;
      return delete store[objGUID];
    }
    return false;
  }

  function addBinding(store, obj) {
    add(store, obj);
    return {
      off: remove.bind(this, store, obj)
    };
  }

  function callListeners(store, thisArg, args) {
    each(store, function (prop) {
      prop.apply(thisArg, args)
    });
  }

  return {
    ensureGUID: ensureGUID,
    getGUID: getGUID,
    hasGUID: getGUID,
    add: add,
    remove: remove,
    addListener: addBinding,
    removeListener: remove,
    callListeners: callListeners,
    present: present
  };
}

/**
 *
 * @type {{ensureGUID, getGUID, hasGUID, add, remove, addListener, removeListener, callListeners, present}}
 */
module.exports = GUIDFactory('_$$lboGUID');
