/**
 * Created by euans on 20/02/2017.
 */

var {prop} = require('../src/descriptors');
const {expect} = require('chai');

describe('prop',function(){
  it('defined a property on an object',function(){
    expect(
      Object.defineProperty({},'test',prop(5))
    ).to.have.a.property('test').that.equals(5);
  });
  it('defines an instance property', function(){
    const d=prop(()=>[]);
    const t1=Object.defineProperty({},'test',d);
    const t2=Object.defineProperty({},'test',d);
    expect(t1).to.have.a.property('test').that.is.an.instanceOf(Array);
    expect(t2).to.have.a.property('test').that.is.an.instanceOf(Array);
    expect(t1.test).to.not.equal(t2.test);
  });
  it('sets and clears enumerable', function(){
    expect(prop().hidden.enumerable).to.equal(false);
    expect(prop().hidden.visible.enumerable).to.equal(true);
  });
  it('sets and clears writable', function(){
    expect(prop().constant.writable).to.equal(false);
    expect(prop().constant.variable.writable).to.equal(true);
  });
  it('sets and clears configureable', function(){
    expect(prop().frozen.configurable).to.equal(false);
    expect(prop().frozen.thawed.configurable).to.equal(true);
  });
  it('can be used to set a default type', function(){
    const enumProp = prop().hidden.constant;
    const TYPE1=enumProp(0);
    const TYPE2=enumProp(1);
    expect(TYPE1).to.not.equal(TYPE2);
    expect(TYPE1.enumerable).to.equal(false);
    expect(TYPE1.writable).to.equal(false);
  });
  it('can be used to set (for example) a constant enum', function(){
    const enumProp = prop().hidden.constant;
    const TYPE3=enumProp(2);
    const o=Object.create(null,{TYPE3});
    expect(o.TYPE3).to.equal(2);
    expect(Object.keys(o).length).to.equal(0);
    o.TYPE3=5;
    expect(o.TYPE3).to.equal(2);
  })
});