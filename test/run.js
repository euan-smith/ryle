/**
 * Created by euans on 26/02/2017.
 */


const chai = require('chai');
const {expect} = chai;
chai.use(require('chai-as-promised'));
const {makeFSM} = require('../src/run');
const {makeState, abstract} = require('../src/state');
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
  it('provides an exit method which (nicely) exits the machine',function(){
    const fsm=makeFSM({$start:()=>{}});
    const fsmInstance=fsm();
    rtn=fsmInstance.then(()=>{throw new Error('Should not resolve')});
    return Promise.race([rtn, fsmInstance.exit().delay(100)]);
  });
  it('can create a composable machine with abstract states',function(){
    const fsm=makeFSM({
      $createContext(){
        return {a:createAction(), b:createAction()}
      },
      $start(){return this.wait},
      wait(context){return on(context.a, this.a).on(context.b, this.b)},
      a:abstract(),
      b:abstract()
    });
    const fsma=fsm();
    const a={},b={};
    fsma.a(a);
    return fsma.then(tr=>{
      expect(tr.state).to.equal(fsm.a);
      expect(tr.payload).to.equal(a);
      const fsmb=fsm();
      fsmb.b(b);
      return fsmb;
    }).then(tr=>{
      expect(tr.state).to.equal(fsm.b);
      expect(tr.payload).to.equal(b);
    });
  });

  it('can use a composable machine',function(){
    const fsm=makeFSM({
      $createContext(){
        return {a:createAction(), b:createAction()}
      },
      $start(){return this.wait},
      wait(context){return on(context.a, this.a).on(context.b, this.b)},
      a:abstract(),
      b:abstract()
    });
    const fsm2=makeFSM({
      $start(){return this.main},
      main(){
        return using(fsm()).on(fsm.a,this.first).on(fsm.b,this.second)
      },
      first:()=>exit(1),
      second:()=>exit(2)
    });
    const fsma=fsm2();
    const a={},b={};
    fsma.a(a);
    return fsma.then(tr=>{
      expect(tr.state).to.equal(fsm.a);
      expect(tr.payload).to.equal(a);
      const fsmb=fsm();
      fsmb.b(b);
      return fsmb;
    }).then(tr=>{
      expect(tr.state).to.equal(fsm.b);
      expect(tr.payload).to.equal(b);
    });
    /*
    the general pattern is:
    ryle.using(context[, OKFn[, failFm]]).on(abstract, alias).on(...)
    in fact how about more generally .using being a chainable method?
    e.g. a superstate can add a using with fsm init in the entry and fsm.exit in the exit and have
    a state machine which runs in parallel.  Or a state which has one or more machines running
    in parallel within it.  Powerful, feels like the right pattern.

    To implement need to watch loops in dependencies, and how to detect a context instance.
    Make an independent identifier of a context.  As $createContext could return anything - should it
    be forced to extend a parent context?  How about suitable duck-typing?
    To be a context it must have:
      -then
      -catch?
      -exit
    Other than that not much is needed, so duck-type the dependent interface.

    so: in state we need an abstract method which creates an abstract state plus an isAbstract check.
    in transition-collection we need the .on method to be able to define concrete methods to abstract results (an alias map)
    also in tc we need a .using method which ties in a state machine instance

     */

  })
});