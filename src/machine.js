/**
 * Created by euans on 16/02/2017.
 */

const {prop, defineProperties} = require('./props');
const {makeState} = require('./state');

class Machine extends Function{
  _hasChild(state){
    return this._children.has(state);
  }
  _hasDescendant(state){
    return this._descendants.has(state);
  }
  _addChild(state){
    this._children.add(state);
    this._addDescendant(state);
  }
  _addDescendant(state){
    this._descendants.add(state);
    if (this._parent) this._parent._addDescendant(state);
  }
}

const machineProps = {
  _children: prop().create(()=>new Set()).hide().fix(),
  _descendants: prop().create(()=>new Set()).hide().fix(),
  _parent: prop().hide()
};


exports.makeMachine = function(obj, parent, machine){
  if (typeof parent !== 'undefined' && !exports.isMachine(parent)) throw new TypeError('second parameter must be undefined or a machine');
  if (typeof obj !== 'object') throw new TypeError('first parameter must be an object');

  if (!machine){
    machine = Object.create(Machine.prototype);
  } else {
    Object.setPrototypeOf(machine, Machine.prototype);
  }
  console.log(machine);
  //todo: Check if this special define props is needed
  defineProperties(machine, machineProps);
  machine._parent = parent;

  //go through all ennumerable properties of the machine definition
  //Any functions => states, any objects => machines
  for (let k of Object.keys(obj)){
    if (typeof obj[k] === 'function'){
      let state = makeState(obj[k]);
      machine[k]=state;
      machine._addChild(state);
    }
    else if (typeof obj[k] === 'object'){
      let submachine = exports.makeMachine(obj[k]);
      machine[k] = submachine;
      machine._addChild(submachine);
    }
  }
  return machine;
};

exports.isMachine = func => func instanceof Machine;