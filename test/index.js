/**
 * Created by euans on 18/12/2016.
 */
var chai=require('chai');
chai.should();
chai.use(require('chai-as-promised'));
ryle=require('../index');

describe('the ryle object', function(){
  it('has a static exit method',function(){
    ryle.should.have.a.property('exit');
  });
  it('can make a simple state machine', function(){
    var factorial=ryle({
      get _start(){return this.init},
      init: function(c){
        c.out=1;
        return this.step;
      },
      step: function(c){
        c.out=c.out*(c.value--);
        if (c.value===1) return ryle.exit(c.out);
        return this.step;
      }
    });
    factorial(6).should.eventually.equal(720);
  });
});