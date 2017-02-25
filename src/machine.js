/**
 * Created by euans on 16/02/2017.
 */

const {prop} = require('./descriptors');
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
  _children: prop(()=>new Set()).hidden.constant,
  _descendants: prop(()=>new Set()).hidden.constant,
  _parent: prop().hidden
};


exports.makeMachine = function(obj, parent, machine){
  if (parent != null && !exports.isMachine(parent)) throw new TypeError('second parameter must be undefined or a machine');
  if (typeof obj !== 'object') throw new TypeError('first parameter must be an object');

  if (!machine){
    machine = Object.create(Machine.prototype);
  } else {
    Object.setPrototypeOf(machine, Machine.prototype);
  }
  Object.defineProperties(machine, machineProps);
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
      let submachine = exports.makeMachine(obj[k], machine);
      machine[k] = submachine;
      machine._addChild(submachine);
    } else throw new TypeError('Machine definition properties must be functions (states) or objects (sub-machines)');
  }
  return machine;
};

exports.isMachine = func => func instanceof Machine;