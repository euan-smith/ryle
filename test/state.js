/**
 * Created by euans on 21/02/2017.
 */

const {expect} = require('chai');
const {makeState, isState} = require('../src/state');

describe('state', function(){
  it('turns a function into a state',function(){
    const fn=()=>{};
    expect(isState(fn)).to.equal(false);
    const state = makeState(fn);
    expect(state).to.equal(fn);
    expect(isState(state)).to.equal(true);
  });
  it('throws an error if a function is not passed', function(){
    expect(()=>makeState()).to.throw(TypeError);
    expect(()=>makeState({})).to.throw(TypeError);
  })
});