/**
 * Created by euans on 26/02/2017.
 */
const {makeMachine, isMachine} = require('./machine');
const {on, create:createColl, isCollection, setTriggerDefinitions} = require('./transition-collection');
const {addState, isResult, create:createResult} = require('./transition-result');
const Promise = require('bluebird');
const {isState, abstract} = require('./state');

function executeState(machine, state, context, payload){
  setTriggerDefinitions(machine.$triggerTypes);
  return state.call(machine, context, payload);
}

function runFsm(machine, transition, context, trans){
  let coll = machine.$superState ? executeState(machine, machine.$superState, context) : null;
  if (!isCollection(coll)) coll = createColl();
  //with forced exit, there should always be a transfer object
  coll.addTransfer(trans);
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
      const rtn = executeState(machine, state, context, transition.payload);
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

function defer(){
  let res,rej;
  const prom = new Promise((rs,rj)=>{res=rs; rej=rj});
  return {prom, res, rej};
}

module.exports.makeFSM = function(obj){
  const target = function(){
    const {prom: forceProm, res: forceExit} = defer();
    const forcedExit = abstract();
    const coll = on(forceProm, forcedExit);
    const context = target.$createContext.apply(this, arguments);
    const runPromise = runFsm(target, createResult(target), context, coll);
    const rtnPromise = runPromise.then(r=>{
        if (r.isExit()) return r.payload;
        if (r.state===forcedExit) return new Promise(res=>{});
        return r;
      });
    context.then=(okFn,failFn)=>rtnPromise.then(okFn,failFn);
    context.catch=failFn=>rtnPromise.catch(failFn);
    context.exit = ()=>{
      forceExit();
      return runPromise.then(()=>{});
    };

    return context;
  };

  return makeMachine(obj, undefined, target);
};
