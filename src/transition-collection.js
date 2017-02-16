/**
 * Created by euans on 11/02/2017.
 */
const Promise = require('bluebird');
const {TransitionResult} = require('./transition-result');
const addState = TransitionResult.addState;
const {prop} = require('./props');
const {onTimeout, onExit, onPromise, onEvent} = require('transition');

const definitions = [];

class TransitionCollection {
  constructor() {
    this._transitions = [];
    this._transferTransitions = null;
  }

  addTransfer(transfer) {
    if (transfer instanceof TransitionCollection) {
      this._transferTransitions = transfer;
    } else {
      throw new TypeError('not a TransitionCollection');
    }
    return this;
  }

  * [Symbol.iterator]() {
    for (let t of this._transitions) if (t.promise) yield t.promise;
    if (this._transferTransitions) yield * this._transferTransitions[Symbol.iterator]();
  }

  _add(transition) {
    this._transitions.push(transition);
    return this;
  }

  onExit(func) {
    return this._add(onExit(func));
  }

  onTimeout(delay, state) {
    return this._add(onTimeout(delay, state));
  }

  on(trigger, stateOnOK, stateOnFail) {
    if (typeof trigger === "boolean") {
      if (trigger) return this._add(onPromise(Promise.resolve(), stateOnOK));
      if (stateOnFail) return this._add(onPromise(Promise.resolve(), stateOnFail));
      return this;
    }

    if (typeof trigger === "object" && typeof trigger.then === "function") {
      return this._add(onPromise(
        Promise.resolve(trigger),
        stateOnOK, stateOnFail
      ));
    }

    //now need to look through definitions.
    let i = definitions.length, bind;
    while (i--) {
      if (bind = definitions[i][0](trigger)) {
        return this._add(onEvent(bind, state));
      }
    }

    throw new Error('no definition for given transition parameters')
  }

  resolve() {
    return Promise.race(this);
  }

  cleanUp() {
    for (let t of this._transitions) if (t.cleanUp) t.cleanUp();
  }
}

exports.isCollection = coll => coll instanceof TransitionCollection;

exports.create = () => new TransitionCollection();

exports.onExit = func => new TransitionCollection().onExit(func);

exports.onTimeout = (delay, state) => new TransitionCollection().onTimeout(delay, state);

exports.on = (trigger, stateOnOK, stateOnFail) => new TransitionCollection().on(trigger, stateOnOK, stateOnFail);

exports.registerEvent = (binderFunc, sample) => {
  let i = definitions.length;
  //The tests are done in reverse order, so it is OK for another test to react to this sample
  // but it is not OK for this test to react to an existing sample
  while (i--) {
    if (binderFunc(definitions[i][1])) throw new Error('This registration reacts to an existing test sample - try being more specific.')
  }

  definitions.push([binderFunc, sample]);
};

/*
 A definition provides a param count (without state), a test function and test params
 A test function is passed a list of parameters before the state selection and returns
 null if not valid or a function _bind_ if it is.

 bind is a function which accepts a callback function as a parameter and returns a cleanup method

 e.g. for mini-signals

 [1, function(signal){
 if (signal instanceof MiniSignal) return callback =>{
 const h=signal.add(callback);
 return ()=>h.detach();
 }, new MiniSignal()]



 */
