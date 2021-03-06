/**
 * Created by EuanSmith on 05/02/2017.
 */

"use strict";
const Promise = require('bluebird');
const prop = require('prop-d');

/**
 * A function which can be listened to.  This is intended to be used as part of an interface, but where
 * it is not known, or not fixed, what methods might be interested in this function being called.
 * @class
 */
class Action extends Function {

  /**
   * Sets the function which the action should call.
   * @param {function} fn is the function which will be called when the action is triggered.
   * @returns {Action} for chaining
   */
  using(fn) {
    if (!(fn instanceof Function)) throw new TypeError('action.on: The parameter must be a function.');
    this._cb = fn;
    this.isActive = true;
    if (this._onceActive){
      this._onceActive();
      this._onceActive=null;
    }
    return this;
  }

  /**
   * Clear any function set with the using method.
   * @returns {Action} for chaining
   * @see {@link using}
   */
  clear() {
    this._cb = null;
    this.isActive = false;
    this._onceActive = this._onceActiveProm = null;
    return this;
  }

  /**
   * Calls the bound function synchronously
   * @param dat
   * @returns {Action}
   */
  trigger(dat) {
    if (this.isActive) {
      this._cb(dat);
    }
    return this;
  }

  /**
   * Calls the bound function asynchronously
   * @param dat
   * @returns {Action}
   */
  triggerAsync(dat) {
    if (this.isActive) {
      Promise.resolve(dat).then(this._cb);
    }
    return this;
  }

  onceActive(){
    if (this._onceActiveProm) return this._onceActiveProm;
    if (this.isActive){
      return this._onceActiveProm = Promise.resolve();
    }
    return this._onceActiveProm = new Promise(resolve=>{
      this._onceActive = resolve;
    })
  }
}

const actionProps = {
  _cb: prop().hidden,
  isActive: prop(false),
  _onceActive: prop().hidden,
  _onceActiveProm: prop().hidden
};

/**
 * Creates an action.
 * @param {boolean} async - if true any set function will be called asynchronously by default.
 * @returns {Action}
 */
function create(async = true) {
  const action = async ?
    function(d){action.triggerAsync(d); return this} :
    function(d){action.trigger(d); return this};
  Object.setPrototypeOf(action, Action.prototype);
  Object.defineProperties(action, actionProps);
  return action;
}

/**
 * Creates one or more actions on a target object.
 * @param {object} target
 * @param {Array<string>} list - the names of the actions to create
 * @param {boolean} async
 * @returns {object}
 * @see {@link Action}
 */
function createOn(target, list, async) {
  var rtn = target || {};
  list.forEach(function (name) {
    rtn[name] = create(async);
  });
  return rtn;
}

/**
 * Tests if a given function is an Action
 * @param fn
 * @returns {boolean}
 */
function isAction(fn) {
  return fn instanceof Action;
}

/**
 * @module
 * @type {{create: create, createOn: createOn, register: register}}
 */
module.exports = {create, createOn, isAction};