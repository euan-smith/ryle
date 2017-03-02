class State extends Function {

}

exports.makeState = function(func){
  if(typeof func !== "function") throw new TypeError('the state definition must be a function');
  Object.setPrototypeOf(func, State.prototype);
  return func;
};

exports.isState = func => func instanceof State;

class AbstractState extends State {
}

exports.abstract = function(){
  return Object.create(AbstractState.prototype);
};

exports.isAbstract = state => state instanceof AbstractState;



