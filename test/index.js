/**
 * Created by euans on 18/12/2016.
 */
require('chai').should();
Ryle=require('../index');

describe('the ryle obejct', function(){
  it('is a contructor',function(){
    Ryle.should.be.a('function');
  });
  it('has a static on method',function(){
    Ryle.should.have.a.property('on');
  })
});