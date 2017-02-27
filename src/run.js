/**
 * Created by euans on 26/02/2017.
 */
const {makeMachine, isMachine} = require('./machine');
const {on, create:createColl, isCollection} = require('./transition-collection');
const {addState, isResult, create:createResult, exit} = require('./transition-result');
const Promise = require('bluebird');
const {isState} = require('./state');

function runFsm(machine, transition, context, trans){
  let coll = machine.$superState ? machine.$superState(context) : null;
  if (!isCollection(coll)) coll = createColl();
  if (trans) coll.addTransfer(trans);
  if (machine === transition.state) {
    if (!isState(machine.$start)) return Promise.reject(new Error(`$start not defined in ${machine.name}`));
    transition.state = machine.$start;
  }
  return runState(machine, transition, context, coll).then(d=> {
    coll.cleanUp();
    return d;
  });
}

function runState(machine, transition, context, trans){
  let prom, state = transition.state;
  if (machine._hasChild(state)){
    if (isMachine(state)) {
      prom = Promise.resolve(runFsm(state, transition, context, trans));
    } else {
      const rtn = state.call(machine, context, transition.payload);
      if (isState(rtn)) prom = Promise.resolve().then(addState(rtn));
      else if (isResult(rtn)) prom = Promise.resolve(rtn);
      else if (isCollection(rtn)) prom = rtn.addTransfer(trans).resolve().then(r=>{rtn.cleanUp(); return r;});
      else if (rtn == null) prom = trans.resolve();
      else return Promise.reject(new TypeError(`Invalid returned object from state ${state.name} in machine ${machine.name}`));
    }
  } else {
    if (!machine._hasDescendant(state)) return transition;
    prom = runFsm(machine._findChildWith(state), transition, context, trans);
  }
  return prom.then(r=>runState(machine, r, context, trans));
}

module.exports.makeFSM = function(obj){
  //todo: add cancel
  //todo: add abstract states
  //todo: add exit transition
  const target = function(){
    const context = target.$createContext.apply(this, arguments);
    const promise = runFsm(target, createResult(target), context)
      .then(r=>r.isExit()?r.payload:r);
    context.then=(okFn,failFn)=>promise.then(okFn,failFn);
    context.catch=failFn=>promise.catch(failFn);
    return context;
  };

  return makeMachine(obj, undefined, target);
};
