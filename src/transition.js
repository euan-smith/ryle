/**
 * Created by euans on 14/02/2017.
 */
const Promise = require('bluebird');
const TransitionResult = require('./transition-result');
const addState = TransitionResult.addState;
const {prop} = require('./props');


/**
 * @class
 */
class Transition {
  reset(){
    if (this._addState){
      this.promise = new Promise(resolve=>this._cb = resolve)
        .then(this._addState)
        .then(r=>{this.reset();return r;});
    } else if (this.promise && !this.promise.isPending()) {
      this.promise = null;
    }
  }
  setPromise(prom){this.promise = prom; return this}
}

const TransitionProps = {
  cleanUp: prop(),
  promise: prop(),
  _addState: prop().hide(),
  _cb: prop().hide()
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
  rtn.promise = Promise.delay(delay).then(addState(state));
  return rtn;
};

exports.onPromise = function(promise, resolveState, rejectState) {
  const rtn = createTransition();
  rtn.promise = rejectState ?
    Promise.resolve(promise).then(addState(resolveState), addState(rejectState)) :
    Promise.resolve(promise).then(addState(resolveState));
  return rtn;
};

exports.onEvent = function(bind, state){
  const rtn = createTransition();
  rtn._addState = addState(state);
  rtn.reset();
  rtn.cleanUp = bind(result=>rtn._cb(result));
};
