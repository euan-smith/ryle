/**
 * Created by euans on 11/02/2017.
 */

class TransitionResult {
  constructor(state, payload){
    this.state = state;
    this.payload=payload;
  }
  isExit(){return this.state===null;}

  static isResult(tr){return tr instanceof TransitionResult;}
  static addState(state){
    return payload=>new TransitionResult(state, payload);
  }
  static exit(payload){
    return new TransitionResult(null, payload);
  }
  static create(state, payload){
    return new TransitionResult(state, payload);
  }
}

module.exports=TransitionResult;