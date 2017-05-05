/**
 * Created by euans on 11/02/2017.
 */
const Promise = require('bluebird');
const TransitionResult = require('./transition-result');
const {hidden} = require('prop-d');
const {onTimeout, onExit, onPromise, onEvent, onMachine} = require('./transition');
const {isAbstract} = require('./state');

let definitions = [];

class TransitionCollection {

  constructor() {
    Object.defineProperties(this, TransitionCollection.properties);
  }

  addTransfer(transfer) {
    if (this._hasCleanedUp) throw new Error('The collection is stale, it has already been cleaned-up');
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
    if (this._hasCleanedUp) throw new Error('The collection is stale, it has already been cleaned-up');
    this._transitions.push(transition);
    return this;
  }

  _addAlias(abstract, state){
    this._aliases.set(abstract, state);
    return this;
  }

  _resolveAlias(result){
    if (this._aliases.has(result.state)){
      return result.setState(this._aliases.get(result.state));
    }
    if (this._transferTransitions){
      return this._transferTransitions._resolveAlias(result);
    }
    return result;
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

    if (isAbstract(trigger)){
      return this._addAlias(trigger, stateOnOK);
    }

    //now need to look through definitions.
    let i = definitions.length, bind;
    while (i--) {
      if (bind = definitions[i](trigger)) {
        return this._add(onEvent(bind, stateOnOK));
      }
    }

    throw new Error('no definition for given transition parameters')
  }

  using(machine, stateOnOK, stateOnFail){
    if (typeof machine!== "object"
      || typeof machine.then !== "function"
      || typeof machine.catch !== "function"
      || typeof machine.exit !== "function"){
      throw new TypeError('First parameter must be a state machine instance');
    }
    return this._add(onMachine(
      machine,
      stateOnOK,
      stateOnFail));
  }

  resolve() {
    if (this._hasCleanedUp) throw new Error('The collection is stale, it has already been cleaned-up');
    return Promise.race(this).then(tr=>this._resolveAlias(tr));
  }

  cleanUp() {
    if (this._hasCleanedUp) throw new Error('The collection has already cleaned-up.');
    for (let t of this._transitions) if (t.cleanUp) {
      t.cleanUp();
    }
    this._hasCleanedUp=true;
  }
}

TransitionCollection.properties = {
  _transitions: hidden(()=>[]).constant,
  _transferTransitions: hidden(),
  _hasCleanedUp: hidden(false),
  _aliases: hidden(()=>new Map()).constant
};


exports.isCollection = coll => coll instanceof TransitionCollection;

exports.create = ()=>new TransitionCollection();

exports.onExit = func => new TransitionCollection().onExit(func);

exports.onTimeout = (delay, state) => new TransitionCollection().onTimeout(delay, state);

exports.on = (trigger, stateOnOK, stateOnFail) => new TransitionCollection().on(trigger, stateOnOK, stateOnFail);

exports.using = (machine, stateOnOK, stateOnFail) => new TransitionCollection().using(machine, stateOnOK, stateOnFail);

exports.setTriggerDefinitions= defs =>{definitions=defs};

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
