/**
 * Created by euans on 26/02/2017.
 */


const chai = require('chai');
const {expect} = chai;
chai.use(require('chai-as-promised'));
const {makeFSM} = require('../src/run');
const {makeState} = require('../src/state');
const {exit, isResult} = require('../src/transition-result');
const {on, registerEvent} = require('../src/transition-collection');
const {create:createAction, ryleRegister} = require('../src/action');
ryleRegister(registerEvent);

describe('run', function(){
  it('creates a simple state machine', function(){
    const fsm = makeFSM({
      $createContext(v){
        return {in:v, out:1}
      },
      $start(){return this.iterate},
      iterate(context){
        context.out*=context.in;
        return on(!!(--context.in), this.iterate, this.done)
      },
      done(context){
        return exit(context.out);
      }
    });
    return expect(fsm(5)).to.eventually.equal(120);
  });
  it('creates a hierarchical state machine', function(){
    const fsm = makeFSM({
      $createContext(v){
        return {in:v, out:1, go:createAction()}
      },
      $start(){return this.wait},
      $superState(context){
        return on(context.go, this.subm1.iterate);
      },
      wait(){},
      subm1:{
        iterate(context){
          context.out*=context.in;
          return on(--context.in>1, this.iterate, fsm.subm2)
        }
      },
      subm2:{
        $start(){return this.done},
        done(context){
          return exit(context.out);
        }
      }
    });
    return expect(fsm(5).go()).to.eventually.equal(120);
  });
  it('throws an error if $start is missing',function(){
    return expect(makeFSM({})()).to.be.rejectedWith(Error);
  });
  it('has a catch method as well as a then',function(){
    return makeFSM({})().catch(()=>{});
  });
  it('throws an error if an invalid result is returned from a state',function(){
    return expect(makeFSM({$start:()=>5})()).to.be.rejectedWith(TypeError);
  });
  it('exits when an unknown state is returned', function(){
    return makeFSM({$start:()=>makeState(()=>{})})().then(tr=>{
      expect(isResult(tr)).to.equal(true);
    })
  });
  it('provides an exit method which (nicely) exits the machine');
  it('can create a composable machine with abstract states');
  it('can use a composable machine')
});