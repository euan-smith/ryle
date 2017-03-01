/**
 * Created by euans on 21/02/2017.
 */

var Promise = require('bluebird');
var transition = require('../src/transition');
var {isResult} = require('../src/transition-result');
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
        console.log(pr.isPending());
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