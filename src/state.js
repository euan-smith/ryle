/**
 * Created by euans on 16/02/2017.
 */

const {prop} = require('./props');

class State extends Function {

}

const stateProps = {

};


exports.makeState = function(func){
  Object.setPrototypeOf(func, State.prototype);
  Object.defineProperties(func, stateProps);
  return func;
};

exports.isState = func => func instanceof State;