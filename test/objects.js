/**
 * Created by EuanSmith on 19/04/2016.
 */

require('chai').should();
var expect = require('chai').expect;
var objects = require('../src/objects');

describe('objects functions', function () {
  it('iterates through all object properties', function () {
    var a = {b: 1, c: 2, d: 3};
    var tot = 0;
    objects.each(a, function (prop) {
      tot += prop;
    });
    tot.should.equal(6);
  });
  it('extends an object', function () {
    expect(objects.extend()).to.equal(undefined);
    var a = {a: 0, b: 0};
    var b = {b: 1, c: 2};
    objects.extend(a, b);
    a.should.have.all.keys(['a', 'b', 'c']);
    a.b.should.equal(1);
    var c = {a: 0, b: 0, extend: objects.extend};
    c.extend(b);
    c.should.have.all.keys(['a', 'b', 'c', 'extend']);
    c.b.should.equal(1);
  });
  it('filters elements from an object', function () {
    var obj = {a1: 0, b1: 0, a2: 0, b2: 0, ab: 0};
    objects.filter(obj, "a").should.have.all.keys(['a1', 'a2', 'ab']);
    objects.filterOut(obj, "b").should.have.all.keys(['a1', 'a2']);
    objects.filter(obj, function (o) {
      return o === "a1" || o === "b2"
    }).should.have.all.keys(['a1', 'b2']);
    objects.filter(obj, /1|2/).should.have.all.keys(['a1', 'b1', 'a2', 'b2']);
  })
});