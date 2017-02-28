/**
 * Created by euans on 25/02/2017.
 */

const {expect} = require('chai');
const {makeState, isState} = require('../src/state');
const {makeMachine, isMachine} = require('../src/machine');

describe('machine.js', function(){
  it('creates an empty state machine with no additional enumerable properites',function(){
    const machine = makeMachine({});
    expect(Object.keys(machine)).has.lengthOf(0);
  });
  it('throws errors for incorrect parameters', function(){
    expect(()=>makeMachine({},{})).to.throw(TypeError);
    expect(()=>makeMachine(5)).to.throw(TypeError);
    expect(()=>makeMachine({a:5})).to.throw(TypeError);
  });
  it('has a (default) $createContext method which can be overridden', function(){
    const machine = makeMachine({});
    expect(machine.$createContext).is.a('function');
    expect(machine.$createContext(1,2,3)).is.deep.equal({arguments:[1,2,3]});
    const machine2 = makeMachine({$createContext(a,b){return {a,b}}});
    expect(machine2.$createContext(1,2,3)).is.deep.equal({a:1,b:2});
    expect(isState(machine2.$createContext)).is.equal(false);
  });
  it('isMachine responds correctly', function(){
    const machine = makeMachine({});
    expect(isMachine(machine)).to.equal(true);
    expect(isMachine({})).to.equal(false);
  });
  it('can extend a function', function(){
    let called=false;
    const fn = ()=>called=true;
    const machine = makeMachine({},null,fn);
    expect(isMachine(machine)).to.equal(true);
    expect(machine).is.instanceOf(Function);
    expect(machine).is.equal(fn);
    expect(called).is.equal(false);
    machine();
    expect(called).is.equal(true);
  });
  it('will have the same methods as the definition, all will be functions', function(){
    const def={a:()=>{}, b:()=>{}};
    const machine = makeMachine(def);
    expect(machine).to.have.all.keys(['a','b']);
    expect(machine.a).to.equal(def.a);
    expect(machine.b).to.equal(def.b);
    expect(isState(machine.a)).to.equal(true);
    expect(machine._hasChild(def.a)).to.equal(true);
    expect(machine._hasDescendant(def.a)).to.equal(true);
  });
  it('can create hierarchical machines', function() {
    const def = {
      a: ()=> {
      }, b: {
        a: ()=> {
        }
      }
    };
    const machine = makeMachine(def);
    expect(machine).to.have.all.keys(['a', 'b']);
    expect(isState(machine.a)).to.equal(true);
    expect(isMachine(machine.b)).to.equal(true);
    expect(isState(machine.b.a)).to.equal(true);
    expect(machine.b._parent).to.equal(machine);
    expect(machine._hasChild(def.a)).to.equal(true);
    expect(machine._hasChild(def.b.a)).to.equal(false);
    expect(machine._hasDescendant(def.a)).to.equal(true);
    expect(machine._hasDescendant(def.b.a)).to.equal(true);
    expect(machine.b._hasChild(def.a)).to.equal(false);
    expect(machine.b._hasChild(def.b.a)).to.equal(true);
  });
  it('can trace a descendant', function(){
    const def = {
      a: ()=> {
      }, b: {
        a: ()=> {
        }
      }
    };
    const machine = makeMachine(def);
    expect(machine._findChildWith(machine.b.a)).to.equal(machine.b);
  });
});
