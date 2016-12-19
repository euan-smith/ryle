/**
 * Created by EuanSmith on 22/04/2016.
 */


/**
 * A state is a function which returns an object which can be another state, a promise or an fsm object
 *  if it is an fsm object it has transitions and cleanup properties which are arrays of promises and
 *  functions.
 *
 *
 *  An machine is an object with _start and, optionally, _superState functions.
 *  _superState is the state function for the machine as a whole - any defined transitions apply regardless of
 *  sub-state.
 *
 *
 *  helper functions:
 *  FSM.on(transition def, nextState).on(promise).onExit(function).onTimeout(delay, nextState)
 *  the chain is an fsm object.  As well as .on and .onExit there is also .then and .catch, either of which
 *  combine the array of promises using Promise.race and apply .then or .catch to that while passing on the
 *  cleanup array.
 *
 *  a state can look like:
 *  state: function(context){
 *      //do stuff on entry
 *      return fsm
 *          .on(context.click,this.state2)
 *          .on(context.cancel,this.cancelled)
 *          .onExit(function(){
 *              context.emit('form.hide');
 *          }
 *  }
 *
 *  A state machine can look like this:
 *  fsm({
 *      _superState: function(context){
 *          return fsm.on(context.cancel,machine.state)
 *      },
 *      get _start(){return this.first;},
 *      first: function(context){return fsm.on(...)};
 *      second: ...
 *  });
 *
 *
 *
 *
 *  runfsm(fsm, state, context, transitions)
 *      //call the enter function
 *      //stack up transitions to pass on
 *      //keep cleanup actions
 *      mtrans=fsm._superState(context)
 *      if (mtrans.__fsm_object)
 *          push all .transitions onto transitions
 *          keep all .cleanup
 *      else if (mtrans.then)
 *          push mtrans onto transitions
 *
 *      if state===fsm, state=fsm._start
 *
 *      return runState(fsm, fsm._start, context, transitions)
 *          .then(function(rslt)
 *              each(cleanUp, function(fn){fn()});
 *              return(rslt);
 *
 *  runState(fsm, state, context, transitions){
 *      //state could be a direct member of fsm and be a state
 *      //>>rtn=state(context), return rtn.race(transitions)
 *      //                              .then(rtn.cleanup; return runState(fsm, rslt, context, transitions));
 *      //state could be a direct member of fsm and be a sub-fsm
 *      //>>return runfsm(state, state, context, transitions)
 *                                      .then(return runState(fsm, rslt, context, transitions));
 *      //it could be a descendant of a member of fsm
 *      //>>return runfsm(newfsm, state, context, transitions)
 *                                      .then(return runState(fsm, rslt, context, transitions));
 *      //or it could lie elsewhere on the chain
 *      //>>return state;
 *      if (state not within fsm) return state
 *      cleanup=[]
 *      prom=undef
 *      if (state in fsm)
 *          if (state is fsm)
 *              prom=runfsm(state, state, context, transitions);
 *          else
 *              rtn=fsm.ify(state(context));//fsm-ify it
 *              prom=rtn.race(transitions);
 *              cleanup=rtn.cleanup;
 *      else
 *          find container
 *          prom=runfsm(container, state, context, transitions);
 *      return prom.then(if (cleanup) cleanup; return runState(fsm, rslt, context, transitions);
 *  }
 *
 *  fsm(state def)
 *      if not a valid fsm def then return it
 *      target function me(context)
 *          return runfsm(me,me,context,[]);
 *      for each proprty
 *          if an object then fsm it.
 *          if an fsm add it's withins to the within list
 *          if a function not guid'd then add it and add to in list
 *      add the ins to the withins
 *
 *  fsm.on()
 *      returns a new chainable object
 *  fsm.on(args...)
 *      return fsm.on().on.call(this,arguments)
 *  fsm.fn.on(promise)
 *      add the promise to the list
 *  fsm.fn.on(promise, state)
 *      add the promise to the list with a then which combines the result with a target state
 *  fsm.fn.on(obj, state)
 *      where the obj has add/remove methods then build a promise around an added callback and wraps the result with state
 *      add the promise to the list and add a function to the cleanup list to remove the callback
 *  fsm.fn.on(obj, evName, state)
 *      where the obj has on/off or sub/unsub or subscribe/unsubscribe then do the same as above using the event name
 *  fsm.fn.onExit(function)
 *      add the function to the cleanup list
 *  fsm.fn.race(promises) will concat the two lists and return a Promise.race(list)
 *  fsm.fn.cleanup() will run all the cleanup functions
 *  fsm.on.add(name,define,match)
 *      add a fsm.fn.on.name which is a handler for a different type of observer pattern
 *      define is a function which is called with all parameters passed to on.name but with the state replaced by resolve
 *      the function should setup resolve as the callback and return a cleanup function which unsubscribes
 *      match is a function which returns true of the passed arguments are (or are duck-typed) of the right kind
 *      e.g.
 *      fsm.on.add(
 *          'myevent',
 *          function(ev, cb){
 *              myhandler.on(ev,cb);
 *              return function(){myhandler.off(ev,cb)}
 *          },
 *          function(args){
 *              return args.length==1 && typeof(args[0])==="string";
 *          }
 *      };
 *      NOTE: if there is no match then the method is only accessible through a direct call.
 *            the above example is probably more suitable for that.
 *
 *
 * in setup give every state and fsm a guid
 * give each fsm a list of directly contained guids and indirectly contained.
 */

var guid = require('./guid');
var objects = require('./objects');
var findFirst = objects.findFirst;
var each = objects.each;
var extend = objects.extend;
var debug=false;
function consoleLog(){
  if (debug) console.log.apply(console,arguments);
}

//Use ES6 Symbols if they are available, otherwise strings will have to do.
var _Symbol = typeof(Symbol)==='function' ?
  function(){return Symbol()}:
  function(n){return n};

const FSM_MACHINE = _Symbol('__fsm_is_fsm');
const FSM_STATE = _Symbol('__fsm_state');
const FSM_ABSTRACT = _Symbol('__fsm_is_abstract');
const FSM_DESCENDANTS = _Symbol('_descendants');
const FSM_CHILDREN = _Symbol('_children');
const enterList = _Symbol('__fsm_onEnter');
const exitList = _Symbol('__fsm_onExit');
const inList = _Symbol('__fsm_onIn');
const activeState = _Symbol('__fsm_active_state');


//a helper to ensure an uncaught error in a promise is thrown.
function rethrow(e) {
  //setTimeout(function () {
  //    throw e
  //}, 0)
  console.log('Uncaught error in state machine: ' , e);
  console.trace();
  throw e;
}

function isChildOf(fsm, stateId) {
  return fsm[FSM_CHILDREN].indexOf(stateId) !== -1;
}

function isDescendantOf(fsm, stateId) {
  return fsm[FSM_DESCENDANTS].indexOf(stateId) !== -1;
}

function isMachine(state) {
  return state[FSM_MACHINE];
}

function isState(state) {
  return state[FSM_STATE];
}

function isFsmObject(obj) {
  return obj instanceof FsmObj;
}


/**
 * I want to change the enter and exit events to be dependent on the context
 * If the calls are sm.state.onenter(context, fn) or sm.state.onenter(context).then then
 * the context could contain a callback store first referencing the state guid then the callbacks
 * There can be two lists on the context, using the __fsm_superState etc
 */

function onEvent(context, list, fn) {
  //storage: context[listName][self.guid][fn.guid]=fn;
  //ensures the callbacks are for a particular INSTANCE of the state machine
  var self = this,
    id = guid.getGUID(self),
    db = context[list] || (context[list] = {}),
    arr = db[id] || (db[id] = {});
  if (fn) return guid.addListener(arr, fn);
  var binding;
  return new Promise(function (resolve) {
    binding = guid.addListener(arr, function (msg, context) {
      resolve({msg: msg, context: context});
    });
  }).then(function (v) {
    binding.off();
    return v;
  });
}

function onEnter(context, fn) {
  return onEvent.call(this, context, enterList, fn);
}
function onExit(context, fn) {
  return onEvent.call(this, context, exitList, fn);
}

//slightly different here: this always only returns a promise so is a one-shot rather than a recurring event
//it also triggers once the machine has entered the state, not as it enters, so the onEntry actions will have completed
//it also will trigger immediately if the state has already been entered.
function onceActive(context) {
  //two cases - it is active now or wait until it's happened
  return context[activeState][guid.getGUID(this)] ?
    Promise.resolve(context) :
    onEvent.call(this, context, inList);
}


//changed it to being synchronous otherwise the listeners were triggered AFTER the state entry
function runListeners(list, msg, state, context) {
  var id = guid.getGUID(state),
    arr = context[list] && context[list][id];
  if (arr) each(arr, function (fn) {
    try {
      fn(msg + '.' + state._origName, context);
    } catch (e) {
      rethrow(e);
    }
  });
}

function findFirstChild(machine, stateId) {
  return findFirst(machine, function (p) {
    return isMachine(p) && isDescendantOf(p, stateId);
  });
}

function runFSM(machine, state, data, context, transferObj) {
  //initiate the state transitions object with the higher-level transitions
  var mTrans = fsm._addTransferObj(transferObj),
    rtn;

  //trigger listeners
  runListeners(enterList, 'enter', machine, context);

  //call the state function if there is one
  if (machine._superState) {
    rtn = machine._superState(context, data);
    //if its an fsm object then add the contents to mTrans
    if (isFsmObject(rtn)) {
      mTrans._add(rtn);
      //if it is a promise then add it to the object
    } else if (rtn instanceof Promise) {
      mTrans.on(rtn);
    }
  }
  //set the active state flag for the moment (this will become a state object
  context[activeState][guid.getGUID(machine)] = true;
  //and trigger the onceActive listeners
  runListeners(inList, 'active', machine, context);
  //if this fsm is the target state then go to start
  if (state === machine) state = machine._start;
  //now kick off and run the state
  return runState(machine, state, data, context, mTrans._getTransferObj())
    .then(function (rslt) {
      //clear the active state for this machine before exiting
      context[activeState][guid.getGUID(machine)] = false;
      //cleanup, includes any fsm.onExit functions
      mTrans._finally();
      //trigger listeners
      runListeners(exitList, 'exit', machine, context);
      //return original result
      return rslt;
    }).catch(rethrow);
}

function hasData(r) {
  return r.hasOwnProperty('_state') && r.hasOwnProperty('_data');
}

function runState(machine, state, data, context, transferObj) {
  // consoleLog('state: '+state._origName);
  var stateId = state && guid.getGUID(state);
  var promise;
  if (isChildOf(machine, stateId)) {
    //state is a direct child of fsm
    //if it is itself an fsm then run it as such
    if (isMachine(state)) {
      promise = runFSM(state, state, data, context, transferObj);
      context[activeState][guid.getGUID(machine)] = state;
      //call the record method if there is one
      if (machine._record) machine._record(context, state._origName);
    } else {
      //else it is a state, so run it to get the transition and initiate a transitions object with
      //the external transitions

      //trigger listeners
      runListeners(enterList, 'enter', state, context);

      //run the state
      var rtn = state.call(machine, context, data),
      //and initiate a return object
        sTrans = fsm._addTransferObj(transferObj);
      //this could be a state, a promise, an fsm object or even a final result
      //if it is an fsm object then add it
      if (isFsmObject(rtn)) sTrans._add(rtn);
      //if it is a promise then add it onto sTrans
      else if (rtn instanceof Promise) sTrans.on(rtn);
      //if it is undefined (i.e. nothing there) then there is no transition from this state and either
      //it is a final state OR there are transitions defined further up the tree so add nothing
      //so if it is NOT undefined (and also not a promise or an fsm object) then
      //turn it into a promise and add it onto sTrans
      else if (rtn !== undefined) sTrans.on(Promise.resolve(rtn));
      //the complete the promise and add a cleanup method
      promise = sTrans._race().then(function (rslt) {
        //set the active state flag to false
        context[activeState][stateId] = false;
        //cleanup
        sTrans._finally();
        //trigger listeners
        runListeners(exitList, 'exit', state, context);
        //check for aliases
        if (hasData(rslt)) {
          rslt._state = sTrans._map(rslt._state);
        } else {
          rslt = sTrans._map(rslt);
        }
        return rslt;
      });
      //set the active state of the state machine
      context[activeState][guid.getGUID(machine)] = state;
      //and the active state flag for the state
      context[activeState][stateId] = true;
      //call the record method if there is one
      if (machine._record) machine._record(context, state._origName);
      consoleLog((context.fsmName || '')+" "+state._origName);

      //and trigger the onceActive listeners
      runListeners(inList, 'active', state, context);
    }
  } else {
    //if the state is not anywhere in this fsm then return it up the chain
    if (!isDescendantOf(machine, stateId)) {
      return Promise.resolve(state);
    }
    promise = runFSM(findFirstChild(machine, stateId), state, data, context, transferObj);
    context[activeState][guid.getGUID(machine)] = state;
  }

  //finally on completion of the state or machine transition to the next.
  return promise.then(function (rslt) {
    if (hasData(rslt))
      return runState(machine, rslt._state, rslt._data, context, transferObj);
    return runState(machine, rslt, undefined, context, transferObj);
  });
}

var fsm_match_definitions = [];
function fsm_define_match(define, match, test, ignoreExistingMatch) {
  if (typeof(define) !== 'function' || typeof(match) !== 'function' || !test) {
    throw new Error('fsm trigger definition: Invalid definition arguments.');
  }
  test = test.concat([null]);
  if (!ignoreExistingMatch && fsm_find_match(test)) {
    throw new Error('fsm trigger definition: there is already a definition which matches the prototype.');
  }
  fsm_match_definitions.push({
    m: match,
    d: function () {
      //copy the args to an array to avoid optimisation hits
      var i, args = new Array(arguments.length);
      for (i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      //get the state to transition to
      var state = args.pop();
      //set a variable for the cleanup and define the promise
      var clean = undefined;
      var prom = new Promise(function (resolve) {
        args.push(resolve);
        clean = define.apply(this, args);
      }).then(function (rslt) {
        //wrap the result with the state transition
        return {_state: state, _data: rslt};
      });
      return {p: prom, c: clean};
    }
  });
  if (fsm_find_match(test) !== fsm_match_definitions[fsm_match_definitions.length - 1].d) {
    throw new Error('fsm trigger definition: the match function does not match the prototype.');
  }
}
function fsm_clear_definitions() {
  fsm_match_definitions = [];
}

function fsm_find_match(args) {
  //search from the latest back.  Newer definitions can be more selective
  var i = fsm_match_definitions.length;
  while (i-- > 0) {
    if (fsm_match_definitions[i].m.apply(this, args)) {
      return fsm_match_definitions[i].d;
    }
  }
}

function FsmObj() {
  //this is a list of transition promises
  this._trans = [];
  //cleanup steps, both to tidy temporary transition objects, but also onExit methods
  this._clean = [];
  //definitions of transitions which can generate promises.  For certain types of transition - superstate
  //transitions which stay within the substate - the promises need to be remade.  These are the transitions
  //of this kind owned by this state - these get cleaned up on exit from THIS state
  this._defs = [];
  //and these are the ones which have been passed up from a parent state machine
  this._transDefs = [];
  //and finally these are aliases to remap abstract states
  this._maps = {};
}

FsmObj.prototype = {
  on: function () {
    //going to want to slice the arguments array, so make a copy to avoid issues of optimisation
    //see https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    var i, args = new Array(arguments.length);
    for (i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    var self = this, len = args.length;
    if (len === 0) return self;
    //The only case for a single argument is if it is a promise
    if (len === 1) {
      if (args[0] instanceof Promise) {
        self._trans.push(args[0]);
        return self;
      } else {
        throw new Error('fsm.fn.on: invalid fsm.on call');
      }
    }
    //a boolean and a transition or two
    if (typeof(args[0])==='boolean' && (len === 2 || len === 3)){
      if (args[0]){
        self._trans.push(Promise.resolve({_state: args[1], _data: undefined}))
      } else {
        if (len === 3) self._trans.push(Promise.resolve({_state: args[2], _data: undefined}))
      }
      return self;
    }
    //a promise and a transition
    if (len === 2 && args[0] instanceof Promise) {
      self._trans.push(args[0].then(function (r) {
        return {_state: args[1], _data: r};
      }));
      return self;
    }
    //a promise and two transitions, one for success and one for failure
    if (len === 3 && args[0] instanceof Promise) {
      self._trans.push(args[0].then(
        function (r) {
          return {_state: args[1], _data: r};
        },
        function (e) {
          return {_state: args[2], _data: e};
        }
      ));
      return self;
    }
    //an abstract state and an alias
    if (len === 2 && args[0][FSM_ABSTRACT]) {
      self._maps[guid.getGUID(args[0])] = args[1];
      return self;
    }
    //now the more general case
    //find the matching transition type def
    var type = fsm_find_match(args);
    //throw an error if it can't be found
    if (!type)
      throw new Error('fsm.fn.on: unknown transition definition');
    //instantiate the def
    var t = type.apply(self, args);
    //store the definition and instantiation
    self._defs.push([type, args, t.c, t.p]);
    return self;
  },
  onTimeout: function (delay, transition) {
    this._trans.push(new Promise(function (resolve) {
      setTimeout(function () {
        resolve(transition);
      }, delay);
    }));
    return this;
  },
  onExit: function (fn) {
    if (typeof fn !== 'function') throw new Error('fsm.fn.onExit: must be called with a function');
    this._clean.push(fn);
    return this;
  },
  _map: function (state) {
    if (state[FSM_ABSTRACT]) {
      var alias = this._maps[guid.getGUID(state)];
      if (alias) return alias;
    }
    return state;
  },
  _addTransferObj: function (transfer) {
    this._trans.push.apply(this._trans, transfer[0]);
    this._transDefs.push.apply(this._transDefs, transfer[1]);
    return this;
  },
  _add: function (fsmObj) {
    var self = this;
    self._trans.push.apply(self._trans, fsmObj._trans);
    self._clean.push.apply(self._clean, fsmObj._clean);
    self._defs.push.apply(self._defs, fsmObj._defs);
    extend(self._maps, fsmObj._maps);
    return self;
  },
  _race: function () {
    // var rtn=type.apply(this, args);
    // self._trans.push(rtn.p);
    // self._clean.push(rtn.c);
    var self = this, defs = self._defs.concat(self._transDefs);
    //race the promises with the instantiated definitions
    return Promise.race(self._trans.concat(defs.map(function (d) {
      return d.pop();
    })))
      .then(function (r) {
        defs.forEach(function (d) {
          //cleanup the instantiated definitions
          d.pop()();
          //and re-instantiate;
          var t = d[0].apply(self, d[1]);
          d.push(t.c);
          d.push(t.p);
        });
        return r;
      });
  },
  _getTransferObj: function () {
    return [this._trans.slice(), this._defs.concat(this._transDefs)];
  },
  _finally: function () {
    this._clean.forEach(function (fn) {
      fn();
    });
    this._defs.forEach(function (d) {
      d[2]();
    });
    return this;
  }
};


//getState resolves the chain of state records
//check context[activeState][thisId] for an object
//If it is undefined, then return an empty string
//
function getState(context) {
  var thisId=guid.getGUID(this);
  var state=context[activeState][thisId];
  if (!state || typeof(state) !== "function") return "";
  if (!state.getState) return state._origName;
  return state._origName + "." + state.getState(context);
  // var self = this;
  // if (isChildOf(self, context[activeState][1])) {
  //   return context[activeState][0]._origName;
  // } else {
  //   var child = findFirstChild(self, context[activeState][1]);
  //   return child._origName + "." + child.getState(context);
  // }
}

function using(context) {
  //this function is intended to be attached to a state machine and is designed to bind one machine as a submachine
  //to another.
  //this means that 'using' becomes a state machine reserved word (I must make a list and warn)
  //It should return an FsmObj instance populated with a cancel transition which would trigger an orderly exit
  //The cancel event is added as an onExit function so that if any other transitions complete the machine will
  //exit before entering any new states

  var rtn = this(context);
  return (new FsmObj())
    .on(rtn)
    .onExit(rtn.cancel);
}

function fsm(def, name) {
  //check if valid
  if (!(typeof def === "object" && def.hasOwnProperty("_start"))) throw new Error('fsm(' + name + '): invalid state machine definition');
  //add a cancelled reason - just use an empty object
  fsm.cancelled = {};
  if (!name) name = "";
  var target = function sm(context) {
    if (!(context instanceof Object)){
      context={value: context};
    }
    //if not in existance, create the store which has the current state
    if (!context[activeState]) context[activeState]={};
    //setup the cancel object
    var cancel;
    //which needs to be encapsulated in a transfer object
    var trans = (new FsmObj())
      .on(new Promise(function (resolve) {
        cancel = resolve;
      }))
      ._getTransferObj();
    //call the state machine and get the return object (a promise)
    var rtn = runFSM(sm, sm, undefined, context, trans)
    //adding a method which throws if cancelled
      .then(function (r) {
        if (r === fsm.cancelled) throw r;
        return r;
      });
    //add a cancel method
    rtn.cancel = function () {
      cancel(fsm.cancelled);
    };
    //and return the promise
    return rtn;
  };
  guid.ensureGUID(target);
  target.onEnter = onEnter;
  target.onExit = onExit;
  target.onceActive = onceActive;
  target.getState = getState;
  target.using = using;
  target[FSM_MACHINE] = true;
  target[FSM_STATE] = true;
  var children = target[FSM_CHILDREN] = [];
  var descendants = target[FSM_DESCENDANTS] = [];
  each(def, function (p, n) {
    if (n.charAt(0) === "_" || n.charAt(0) === "$" || (typeof(p) === "object" && p[FSM_ABSTRACT])) {
      //a non-state fsm property or a custom property or an abstract state so just add it
      //go back to the property descriptor to deal with getters in particular
      Object.defineProperty(target, n, Object.getOwnPropertyDescriptor(def, n));
    } else {
      if (typeof(p) === "object") {
        //assume it is a state machine.
        p = fsm(p, name + '.' + n);
        p._origName = n;
      }
      if (typeof(p) === "function") {
        if (!isState(p)) {
          guid.ensureGUID(p);
          p.onEnter = onEnter;
          p.onExit = onExit;
          p.onceActive = onceActive;
          p._origName = n;
          p[FSM_STATE] = true;
        } else if (isMachine(p)) {
          descendants.push.apply(descendants, p[FSM_DESCENDANTS]);
          if (!p.hasOwnProperty('_origName'))p._origName = n;
        }
        children.push(guid.getGUID(p));
        target[n] = p;
      }
      else {
        throw new Error('fsm(' + name + '.' + n + '): invalid state definition - use a "$" prefix for private properties');
      }
    }
  });
  descendants.push.apply(descendants, children);
  return target;
}
fsm.fn = FsmObj.prototype;
function fsmAttach(n) {
  return function () {
    return fsm.fn[n].apply(new FsmObj(), arguments);
  };
}
fsm.on = fsmAttach('on');
fsm.onExit = fsmAttach('onExit');
fsm.onTimeout = fsmAttach('onTimeout');
fsm._addTransferObj = fsmAttach('_addTransferObj');
fsm.defineOn = fsm_define_match;
fsm.clearDefinitions = fsm_clear_definitions;
fsm.abstract = function () {
  var rtn = {};
  rtn[FSM_ABSTRACT] = true;
  guid.ensureGUID(rtn);
  return rtn;
};
Object.defineProperty(fsm,'debug',{
  set: function(v){
    debug=v;
  }
});

module.exports = fsm;