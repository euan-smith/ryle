/**
 * Created by EuanSmith on 20/04/2016.
 */
/**
 * This is based on http://dean.edwards.name/weblog/2005/10/add-event/ which is, for example, the approach
 * taken by jQuery
 */


var each = require('./objects').each;
var name = typeof(Symbol)==="function"? Symbol() : '_$$lboGUID';

var guid = 1;

function ensureUID(fn) {
  return fn[name] || (fn[name] = guid++);
}

function getUID(fn) {
  return fn && fn[name];
}

function add(store, obj) {
  if (!store.hasOwnProperty('count')) {
    Object.defineProperty(store, 'count', {value: 0, enumerable: false, writable: true});
  }
  var objGUID = ensureUID(obj);
  if (!store.hasOwnProperty(objGUID))store.count++;
  store[objGUID] = obj;
  return obj;
}

function present(store, obj) {
  return !!(obj[name] && store[ensureUID(obj)]);
}

//NOTE: think about doing the store in an alternative way with a custom store iterator rather than assuming
//that it is a general object - with delete it won't perform well in V8, although that won't matter most
//of the time.  Sparse arrays (as the guids are integers) may be the way to go.
function remove(store, obj) {
  var objGUID = getUID(obj);
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

module.exports = {
  ensureGUID: ensureUID,
  getGUID: getUID,
  hasGUID: present,
  add: add,
  remove: remove,
  addListener: addBinding,
  removeListener: remove,
  callListeners: callListeners,
  present: present
};

