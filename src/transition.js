/**
 * Created by euans on 14/02/2017.
 */
const Promise = require('bluebird');
const {addState, isResult} = require('./transition-result');
const prop = require('prop-d');


/**
 * @class
 */
class Transition {
  reset(){
    if (this._addState){
      this.setPromise(new Promise(resolve=>this._cb = resolve)
        .then(this._addState));
    } else {
      if (this.promise && !this.promise.isPending()) {
        this.setPromise(null);
      }
    }
  }

  setPromise(prom){
    if (!prom){
      this.promise = null;
    } else {
      this.promise = prom;
      prom.then(r=>{this.reset();return r;}, ()=>{});
    }
  }
  //setPromise(prom){this.promise = prom; return this}
}

const TransitionProps = {
  cleanUp: prop(),
  promise: prop(),
  _addState: prop().hidden,
  _cb: prop().hidden
};

function createTransition(){
  return Object.create(Transition.prototype, TransitionProps);
}


exports.onExit = function(func) {
  const rtn = createTransition();
  rtn.cleanUp = func;
  return rtn;
};

exports.onTimeout = function(delay, state){
  const rtn = createTransition();
  rtn.setPromise(Promise.delay(delay).then(addState(state)));
  return rtn;
};

exports.onPromise = function(promise, resolveState, rejectState, exitFunc) {
  const rtn = createTransition();
  rtn.setPromise(rejectState ?
    Promise.resolve(promise).then(addState(resolveState), addState(rejectState)) :
    Promise.resolve(promise).then(addState(resolveState)));
  if (exitFunc) rtn.cleanUp = exitFunc;
  return rtn;
};

exports.onMachine = function(machine, resolveState, rejectState){
  const rtn = createTransition();
  rtn.setPromise(machine.then(rslt=>{
    if (isResult(rslt)) return rslt;
    if (resolveState) return addState(resolveState)(rslt);
    throw new Error('Attached machine has exited with no state transition defined on parent.')
  }, er=>{
    if (rejectState) return addState(rejectState)(er);
    throw er;
  }));
  rtn.cleanUp = ()=>machine.exit();
  return rtn;
};

exports.onEvent = function(bind, state){
  const rtn = createTransition();
  rtn._addState = addState(state);
  rtn.reset();
  rtn.cleanUp = bind(result=>rtn._cb(result));
  return rtn;
};
