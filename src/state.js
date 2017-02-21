/**
 * Created by euans on 16/02/2017.
 */

const {prop} = require('./descriptors');

class State extends Function {

}

const stateProps = {

};


exports.makeState = function(func){
  if(typeof func !== "function") throw new TypeError('the state definition must be a function');
  Object.setPrototypeOf(func, State.prototype);
  Object.defineProperties(func, stateProps);
  return func;
};

exports.isState = func => func instanceof State;