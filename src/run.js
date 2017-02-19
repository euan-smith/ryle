/**
 * Created by euans on 15/02/2017.
 */

const {create:createColl, isCollection} = require('./transition-collection');
const {addState, isResult} = require('./transition-result');
const Promise = require('bluebird');
const {isState} = require('./state');
const {isMachine} = require('./machine');
console.log(isMachine);

function runFsm(machine, transition, context, trans){
  let coll = machine.$superState ? machine.$superState() : null;
  if (!isCollection(coll)) coll = createColl();
  if (trans) coll.addTransfer(trans);
  if (machine === transition.state) {
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
      else throw new TypeError('Invalid returned object from a promise');
    }
  } else {
    if (!machine._hasDescendant(state)) return transition;
    prom = runFsm(machine._findChildWith(state), transition, context, trans);
  }
  return prom.then(r=>runState(machine, r, context, trans));
}

module.exports = {runFsm, runState};

