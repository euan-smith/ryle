/**
 * Created by euans on 17/02/2017.
 */
const {makeMachine} = require('./machine');
const {runFsm} = require('./run');
const TransitionResult = require('./transition-result');
const {onExit, onTimeout, on, registerEvent} = require('./transition-collection');

function ryle(obj){
  //todo: add cancel
  //todo: add abstract states
  //todo: add exit transition
  const target = function(context, ...rest){
    if (typeof context !== 'object'){
      context = {arguments: [context, ...rest]}
    }

    return runFsm(target, TransitionResult.entry(target), context)
      .then(r=>r.isExit()?r.payload:r);
  };

  return makeMachine(obj, undefined, target);
}

Object.assign(ryle, {onExit, onTimeout, on});

ryle.exit=val=>TransitionResult.exit(val);

module.exports = ryle;