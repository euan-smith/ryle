const {using, onExit, onTimeout, on, registerEvent} = require('./src/transition-collection');
const {makeFSM} = require('./src/run');
const {exit}  = require('./src/transition-result');

const constantTrue = require('prop-d')(true).hidden.constant;

function ryle(obj){
  return makeFSM(obj);
}

Object.assign(ryle, {
  onExit,
  onTimeout,
  on,
  using,
  exit,
  use(lib){
    if (typeof lib.ryleRegister !== "function"){
      throw new TypeError('library does not have a Ryle registration method');
    }
    if (lib.ryleRegister._ryleInstalled) return;
    Object.defineProperty(lib.ryleRegister, '_ryleInstalled', constantTrue);
    lib.ryleRegister(registerEvent);
    return this;
  }
});

//add in the actions and bind them
ryle.action = require('./src/action');
ryle.use(ryle.action);

module.exports = ryle;

