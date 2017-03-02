/**
 * Created by euans on 23/02/2017.
 */

const chai = require('chai');
const {expect} = chai;
chai.use(require('chai-as-promised'));
chai.use(require('chai-iterator'));
const Promise = require('bluebird');

const {isCollection, create, onExit, onTimeout, on, using, registerEvent, _clearRegister} = require('../src/transition-collection');
const {makeState, abstract} = require('../src/state');
const {isResult} = require('../src/transition-result');
var action = require('../src/action');


describe('transition-collection.js', function(){
  it('create makes a transition collection', function(){
    const tc = create();
    expect(isCollection(tc)).to.equal(true);
  });
  it('is an iterable', function(){
    const tc = create();
    expect(tc).to.iterate.for.lengthOf(0);
  });
  it('has a chainable onExit method which adds a cleanup function', function(){
    const tc = create();
    const fn = ()=>fnCalled=true;
    let fnCalled = false;
    expect(tc.onExit(fn)).to.equal(tc);
    expect(fnCalled).to.equal(false);
    tc.cleanUp();
    expect(fnCalled).to.equal(true);
    expect(()=>tc.cleanUp()).to.throw(Error);
  });
  it('the static onExit creates a new collection with a cleanup function', function(){
    const fn = ()=>fnCalled=true;
    let fnCalled = false;
    const tc=onExit(fn).onTimeout(100, makeState(()=>{}));
    expect(isCollection(tc)).to.equal(true);
    tc.cleanUp();
    expect(fnCalled).to.equal(true);
  });
  it('has an onTimeout method which adds an ontimeout transition', function(){
    const state1 = makeState(()=>{});
    const state2 = makeState(()=>{});
    const tc = onTimeout(150, state1);
    expect(isCollection(tc)).to.equal(true);
    expect(tc.onTimeout(100, state2)).to.equal(tc);
    expect(tc).to.iterate.for.lengthOf(2);
    return tc.resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state2);
    });
  });
  it('resolve will ignore cleanup only transitions', function(){
    return onTimeout(0,makeState(()=>{})).onExit(()=>{}).resolve();
  });
  it('has an on method which can trigger on a boolean', function(){
    const state = makeState(()=>{});
    return on(true, state).resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state);
    });
  });
  it('has an on method which can conditionally trigger on a boolean', function(){
    const state1 = makeState(()=>{});
    const state2 = makeState(()=>{});
    return on(false, state1).on(true, state2).resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state2);
    });
  });
  it('has an on method which can transition to one of two states on a boolean', function(){
    const state1 = makeState(()=>{});
    const state2 = makeState(()=>{});
    return on(true, state1, state2).resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state1);
      return on(false, state1, state2).resolve();
    }).then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state2);
    });
  });
  it('has an on method which can trigger on a promise', function(){
    const state = makeState(()=>{});
    const d1 = {};
    return on(Promise.resolve(d1), state).resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state);
      expect(tr.payload).to.equal(d1);
    });
  });
  it('has an on method which will throw an error when a reject state is not supplied and the promise rejects', function(){
    const state = makeState(()=>{});
    const d1 = {};
    return on(Promise.reject(d1), state).resolve().then(()=>{
      throw new Error('Transition has resolved when it should have rejected')
    },d=>{
      expect(d).to.equal(d1);
    });
  });
  it('has an on method which can transition to one of two states on a boolean', function(){
    const state1 = makeState(()=>{});
    const state2 = makeState(()=>{});
    const d1={}, d2={};
    return on(Promise.resolve(d1), state1, state2).resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state1);
      expect(tr.payload).to.equal(d1);
      return on(Promise.reject(d2), state1, state2).resolve();
    }).then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state2);
      expect(tr.payload).to.equal(d2);
    });
  });
  function makeBinder(clean){
    let cb;
    function trig(v){cb(v)}
    return {trig, bind:res=>{cb=res; return clean}}
  }
  function makeRegister(name, clean){
    const {trig, bind} = makeBinder(clean);
    return {evCheck:function(evName){
      return evName === name && bind;
    }, trig};
  }
  function makeDualRegister(name1, name2, clean1, clean2){
    const {trig:trig1, bind:bind1} = makeBinder(clean1);
    const {trig:trig2, bind:bind2} = makeBinder(clean2);
    return {evCheck:function(evName){
      return evName === name1 ? bind1 :
        evName === name2 ? bind2 : false;
    }, trig1, trig2};
  }
  it('registers an event which can be triggered', function(){
    _clearRegister();
    let cnt=0;
    const state = makeState(()=>{});
    const {evCheck, trig} = makeRegister('test1', ()=>cnt++);
    registerEvent(evCheck, 'test1');
    const tc = on('test1',state);
    trig(5);
    return tc.resolve().then(tr=>{
      expect(isResult(tr)).to.equal(true);
      expect(tr.state).to.equal(state);
      expect(tr.payload).to.equal(5);
      tc.cleanUp();
      expect(cnt).to.equal(1);
    })
  });
  it('throws an error if the registration isn\'t valid', function(){
    _clearRegister();
    expect(()=>registerEvent(s=>false, 'test')).to.throw(Error);
  });
  it('throws an error if there is already a registration for the given type', function(){
    _clearRegister();
    registerEvent(s=>true, 'test');
    expect(()=>registerEvent(s=>true, 'test')).to.throw(Error);
  });
  it('throws an error if an event is not recognised', function(){
    _clearRegister();
    expect(()=>on('undefined', makeState(()=>{}))).to.throw(Error);
  });
  it('can register more than one event type', function(){
    _clearRegister();
    let cnt=0;
    const state1 = makeState(()=>{}),state2 = makeState(()=>{});
    const {evCheck, trig1, trig2} = makeDualRegister('test1','test2',()=>cnt++,()=>cnt+=2);
    const d1={}, d2={};
    registerEvent(evCheck, ['test1','test2']);
    const tc = on('test1',state1).on('test2',state2);
    trig1(d1);
    return tc.resolve().then(tr=>{
      expect(tr.state).to.equal(state1);
      expect(tr.payload).to.equal(d1);
      trig2(d2);
      return tc.resolve();
    }).then(tr=>{
      expect(tr.state).to.equal(state2);
      expect(tr.payload).to.equal(d2);
      trig1(d2);
      return tc.resolve();
    }).then(tr=>{
      expect(tr.state).to.equal(state1);
      expect(tr.payload).to.equal(d2);
    })
  });
  it('can be triggered by different events and reset in between', function(){
    _clearRegister();
    let cnt=0;
    const state1 = makeState(()=>{});
    const state2 = makeState(()=>{});
    const {evCheck:check1, trig:trig1} = makeRegister('test1', cnt++);
    const {evCheck:check2, trig:trig2} = makeRegister('test2', cnt+=2);
    const d1={}, d2={};
    registerEvent(check1, 'test1');
    registerEvent(check2, 'test2');
    const tc = on('test1',state1).on('test2',state2);
    trig1(d1);
    return tc.resolve().then(tr=>{
      expect(tr.state).to.equal(state1);
      expect(tr.payload).to.equal(d1);
      trig2(d2);
      return tc.resolve();
    }).then(tr=>{
      expect(tr.state).to.equal(state2);
      expect(tr.payload).to.equal(d2);
      trig1(d2);
      return tc.resolve();
    }).then(tr=>{
      expect(tr.state).to.equal(state1);
      expect(tr.payload).to.equal(d2);
    })
  });
  it('an error will be thrown if a stale collection is added to or resolved', function(){
    const tc = onExit(()=>{});
    tc.cleanUp();
    expect(()=>tc.onExit(()=>{})).to.throw(Error);
    expect(()=>tc.resolve()).to.throw(Error);
    expect(()=>tc.addTransfer()).to.throw(Error);
  });
  it('can use a transfer object', function(){
    _clearRegister();
    let cnt=0;
    const state1 = makeState(()=>{});
    const state2 = makeState(()=>{});
    const {evCheck:check1, trig:trig1} = makeRegister('test1', cnt++);
    const {evCheck:check2} = makeRegister('test2', cnt+=2);
    const d1={};
    registerEvent(check1, 'test1');
    registerEvent(check2, 'test2');
    const tc1 = on('test1',state1);
    const tc2 = on('test2',state2);
    expect(()=>tc2.addTransfer({})).to.throw(TypeError);
    tc2.addTransfer(tc1);
    trig1(d1);
    return tc2.resolve().then(tr=>{
      expect(tr.state).to.equal(state1);
      expect(tr.payload).to.equal(d1);
      expect(cnt).to.equal(3);
    });
  });
  it('can add an alias to an abstract state', function(){
    _clearRegister();
    const abs = abstract();
    const state = makeState(()=>{});
    const tc1 = on(abs,state);
    const tc2 = on(true, abs);
    tc2.addTransfer(tc1);
    return tc2.resolve().then(tr=>{
      expect(tr.state).to.equal(state);
    })
  });
  describe('has a using method which binds in an eternal state machine',function(){
    it('will resolve when the attached machine does', function(){
      //here a state machine has then, catch and exit methods
      let res,rej;
      const mockFsm = new Promise((rs,rj)=>{res=rs; rej=rj});
      let exited = false;
      mockFsm.exit = ()=>{exited=true; return Promise.resolve()};

      const state1 = makeState(()=>{}),state2 = makeState(()=>{});
      const tc=using(mockFsm, state1, state2);

      res(5);
      return tc.resolve().then(tr=>{
        expect(tr.state).to.equal(state1);
        expect(tr.payload).to.equal(5);
      });
    });
    it('will resolve the second state when the attached machine reject', function(){
      //here a state machine has then, catch and exit methods
      let res,rej;
      const mockFsm = new Promise((rs,rj)=>{res=rs; rej=rj});
      let exited = false;
      mockFsm.exit = ()=>{exited=true; return Promise.resolve()};

      const state1 = makeState(()=>{}),state2 = makeState(()=>{});
      const tc=using(mockFsm, state1, state2);

      rej(7);
      return tc.resolve().then(tr=>{
        expect(tr.state).to.equal(state2);
        expect(tr.payload).to.equal(7);
      });
    });
    it('will reject when the attached machine does', function(){
      //here a state machine has then, catch and exit methods
      let res,rej;
      const mockFsm = new Promise((rs,rj)=>{res=rs; rej=rj});
      let exited = false;
      mockFsm.exit = ()=>{exited=true; return Promise.resolve()};

      const state1 = makeState(()=>{});
      const tc=using(mockFsm, state1);

      const e = new Error();
      rej(e);
      return tc.resolve().then(()=>{
        throw new Error('Should not have resolved')
      },err=>{
        expect(err).to.equal(e);
      });
    });
    it('the attached machine will exit when another transition occurs', function(){
      //here a state machine has then, catch and exit methods
      let res,rej;
      const mockFsm = new Promise((rs,rj)=>{res=rs; rej=rj});
      let exited = false;
      mockFsm.exit = ()=>{exited=true; return Promise.resolve()};

      const state1 = makeState(()=>{}),state2 = makeState(()=>{});
      const tc=using(mockFsm, state1).on(true, state2);

      return tc.resolve().then(tr=>{
        expect(tr.state).to.equal(state2);
        expect(exited).to.equal(false);
        tc.cleanUp();
        expect(exited).to.equal(true);
      });
    });
    it('an error will be thrown if the supplied object is not a machine instance', function(){
      expect(()=>using({})).to.throw(TypeError);
    })
  });
});
