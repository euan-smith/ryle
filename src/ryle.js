/**
 * Created by euans on 17/02/2017.
 */
const {onExit, onTimeout, on, registerEvent, create:createColl, isCollection} = require('./transition-collection');
const {makeFSM} = require('./run');

function ryle(obj){
  return makeFSM(obj);
}
//todo: implement registration

Object.assign(ryle, {onExit, onTimeout, on});

ryle.exit=val=>exit(val);

module.exports = ryle;

