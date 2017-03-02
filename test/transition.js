/**
 * Created by euans on 21/02/2017.
 */

var Promise = require('bluebird');
var transition = require('../src/transition');
var {isResult, exit, create:createResult} = require('../src/transition-result');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const {expect} = chai;
const {makeState} = require('../src/state');


describe('transition.js', function(){
  describe('onExit', function(){
    it('should create a transition with only cleanup', function(){
      const fn=()=>{};
      const t = transition.onExit(fn);
      expect(t).to.have.a.property('cleanUp').that.equals(fn);
      expect(t).to.have.a.property('promise').that.equals(undefined);
    });
  });
  describe('onTimeout', function(){
    it('should create a transition with a promise and no cleanup', function(){
      this.timeout(150);
      const s=makeState(()=>{});
      const t = transition.onTimeout(100,s);
      expect(t).to.have.a.property('cleanUp').that.equals(undefined);
      expect(t).to.have.a.property('promise').that.is.an.instanceOf(Promise);
    });
    it('should create a transition that resolves after the timeout', function(){
      this.timeout(150);
      const s=makeState(()=>{});
      const t = transition.onTimeout(100,s);
      return t.promise.then(tr=>{
        expect(isResult(tr)).to.equal(true);
        expect(tr.state).to.equal(s);
      })
    });
  });
  describe('onPromise', function(){
    const s1=makeState(()=>{});
    const s2=makeState(()=>{});
    it('should create a transition with a promise and no cleanup', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const t = transition.onPromise(p,s1,s2);
      expect(t).to.have.a.property('cleanUp').that.equals(undefined);
      expect(t).to.have.a.property('promise').that.is.an.instanceOf(Promise);
    });
    it('can optionally include a cleanup function', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const fn=()=>{};
      const t = transition.onPromise(p,s1,s2,fn);
      expect(t).to.have.a.property('cleanUp').that.equals(fn);
    });
    it('with one state, should create a transition which resolves to that state', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const d = {};
      res(d);
      return transition.onPromise(p,s1).promise.then(tr=>{
        expect(isResult(tr)).to.equal(true);
        expect(tr.state).to.equal(s1);
        expect(tr.payload).to.equal(d);
      });
    });
    it('will ignore reset if it has not resolved', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const d = {};
      res(d);
      const t=transition.onPromise(p,s1);
      t.reset();
      return t.promise;
    });
    it('will null promise after resolving', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const d = {};
      const t=transition.onPromise(p,s1);
      const pr=t.promise;
      res(d);
      return pr.then(()=>{
        expect(t.promise).to.equal(null);
      });
    });
    it('with one state, should create a transition which rejects with an error', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const e = new Error();
      rej(e);
      return expect(transition.onPromise(p,s1).promise).to.be.rejectedWith(e);
    });
    it('with two states, should create a transition which resolves to the first', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const d = {};
      res(d);
      return transition.onPromise(p,s1,s2).promise.then(tr=>{
        expect(isResult(tr)).to.equal(true);
        expect(tr.state).to.equal(s1);
        expect(tr.payload).to.equal(d);
      });
    });
    it('with two states, should create a transition which rejects to the second', function(){
      let res, rej;
      const p = new Promise((resolve, reject)=>{res=resolve; rej=reject});
      const e = new Error();
      rej(e);
      return transition.onPromise(p,s1,s2).promise.then(tr=>{
        expect(isResult(tr)).to.equal(true);
        expect(tr.state).to.equal(s2);
        expect(tr.payload).to.equal(e);
      });
    });
  });
  describe('onMachine', function(){
    const state1=makeState(()=>{});
    const state2=makeState(()=>{});
    let res,rej,exited;
    function makeMockFsm(){
      const mockFsm = new Promise((rs,rj)=>{res=rs; rej=rj});
      exited = false;
      mockFsm.exit = mockExit;
      return mockFsm;
    }
    const mockExit = ()=>{exited=true; return Promise.resolve()}
    it('will resolve when the attached machine does', function(){
      //here a state machine has then, catch and exit methods
      const mockFsm = makeMockFsm();
      const t=transition.onMachine(mockFsm, state1, state2);

      res(5);
      return t.promise.then(tr=>{
        expect(tr.state).to.equal(state1);
        expect(tr.payload).to.equal(5);
      });
    });
    it('will throw an error if attached machine resolves with something other than a transition result and there is no resolveState supplied', function(){
      //here a state machine has then, catch and exit methods
      const mockFsm = makeMockFsm();
      const t=transition.onMachine(mockFsm);

      res(5);
      return expect(t.promise).to.be.rejectedWith(Error);
    });
    it('will resolve with the same transition when the attached machine does', function(){
      //here a state machine has then, catch and exit methods
      const mockFsm = makeMockFsm();
      const t=transition.onMachine(mockFsm, state1, state2);
      const state3 = makeState(()=>{});

      res(createResult(state3, 5));
      return t.promise.then(tr=>{
        expect(tr.state).to.equal(state3);
        expect(tr.payload).to.equal(5);
      });
    });
    it('will resolve the second state when the attached machine reject', function(){
      //here a state machine has then, catch and exit methods
      const mockFsm = makeMockFsm();
      const t=transition.onMachine(mockFsm, state1, state2);

      rej(7);
      return t.promise.then(tr=>{
        expect(tr.state).to.equal(state2);
        expect(tr.payload).to.equal(7);
      });
    });
    it('will reject when the attached machine does', function(){
      //here a state machine has then, catch and exit methods
      const mockFsm = makeMockFsm();
      const t=transition.onMachine(mockFsm, state1);

      const e = new Error();
      rej(e);
      return t.promise.then(()=>{
        throw new Error('Should not have resolved')
      },err=>{
        expect(err).to.equal(e);
      });
    });
    it('the attached machine will exit on cleanUp', function(){
      //here a state machine has then, catch and exit methods
      const mockFsm = makeMockFsm();

      const t=transition.onMachine(mockFsm, state1, state2);
      t.cleanUp();

      expect(exited).to.equal(true);
    });
  });
  describe('onEvent', function(){
    const state = makeState(()=>{});
    function makeBinder(clean){
      let cb;
      function trig(v){cb(v)}
      return {trig, bind:res=>{cb=res; return clean}}
    }
    it('creates a transition with both cleanUp and promise', function(){
      const clean = ()=>{};
      const {bind}=makeBinder(clean);
      const t = transition.onEvent(bind, state);
      expect(t).to.have.a.property('cleanUp').that.equals(clean);
      expect(t).to.have.a.property('promise').that.is.an.instanceOf(Promise);
    });
    it('creates a transition which resolves on the first trigger with the right data', function(){
      const clean = ()=>{};
      const {trig, bind}=makeBinder(clean);
      const t = transition.onEvent(bind, state);
      const d1="data1", d2="data2";
      trig(d1);
      trig(d2);
      return t.promise.then(tr=>{
        expect(tr.state).to.equal(state);
        expect(tr.payload).to.equal(d1);
      })
    });
    it('creates a transition which resolves on trigger and automatically resets', function(){
      const clean = ()=>{};
      const {trig, bind}=makeBinder(clean);
      const t = transition.onEvent(bind, state);
      const d1="data1", d2="data2";
      trig(d1);
      return t.promise.then(tr=>{
        expect(tr.payload).to.equal(d1);
        trig(d2);
        return t.promise;
      }).then(tr=>{
        expect(tr.payload).to.equal(d2);
      })
    });
  });
});