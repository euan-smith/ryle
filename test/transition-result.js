/**
 * Created by euans on 21/02/2017.
 */

const {expect} = require('chai');
const {makeState, isState} = require('../src/state');
const {create, entry, exit, addState, isResult} = require('../src/transition-result');

describe('transition-result.js', function(){
  const state = makeState(()=>{});
  describe('create',function(){
    it('creates a transition result with a state and payload', function(){
      const r = create(state,42);
      expect(r.state).to.equal(state);
      expect(r.payload).to.equal(42);
    });
  });
  describe('isResult', function(){
    it('returns true for a result', function(){
      expect(isResult(create(state))).to.equal(true);
    });
    it('returns false for anything else', function(){
      expect(isResult(4)).to.equal(false);
      expect(isResult('qwe')).to.equal(false);
      expect(isResult([])).to.equal(false);
      expect(isResult({})).to.equal(false);
    })
  });
  describe('addState', function(){
    it('returns a function', function(){
      expect(addState(state)).to.be.an.instanceOf(Function);
    });
    it('which turns a payload into a result', function(){
      const r = addState(state)(42);
      expect(r.state).to.equal(state);
      expect(r.payload).to.equal(42);
      expect(isResult(r)).to.equal(true);
    });
  });
  describe('exit',function(){
    it('returns an exit result', function(){
      const r = exit(42);
      expect(r.payload).to.equal(42);
      expect(isResult(r)).to.equal(true);
      expect(r.isExit()).to.equal(true);
    });
  });
});