/**
 * Created by EuanSmith on 19/04/2016.
 */


var action = require('../src/action');
const {expect} = require('chai');

describe('action.js', function () {
  describe('create', function(){
    it('creates an action which can be subscribed to and asynchronously triggered', function (done) {
      let test=false;
      action.create()
        .using(()=>{
          if (!test) done(new Error('test should be true!'));
          done();
        })
        ();
      test=true;
    });
    it('creates an action which reports if it is active or not', function(){
      const act = action.create();

    });
    it('creates an action which can be called synchronously or asynchronously', function (done) {
      let cnt=0;
      action.create(false)
        .using(v=>cnt+=v)
        (1);
      expect(cnt).to.equal(1);
      action.create(true)
        .using(v=>cnt+=v)
        (2);
      expect(cnt).to.equal(1);
      action.create(true)
        .using(()=>{
          try{
            expect(cnt).to.equal(3);
          } catch(e){
            done(e)
          }
          done();
        })();
    });
    it('creates an action which can be unsubscribed from', function (done) {
      action.create(false)
        .using(()=> done(new Error('should not have been triggered')))
        .clear()
        ();
      action.create(true)
        .using(()=> done(new Error('should not have been triggered')))
        .clear()
        ();
      action.create(true).using(done)();
    });
    it('creates an action which throws an error if if something other than a function is supplied', function(done){
      try{
        action.create().using({});
      } catch(e){
        expect(e).to.be.an.instanceOf(TypeError);
        done();
      }
      throw new Error('Error was not thrown as expected')
    });
  });
  describe('createOn',function(){
    it('creates an object of actions constructed from an array', function () {
      var def = ['one', 'two'];
      var target={'three':3};
      var acts = action.createOn(target, def, false);
      expect(acts).to.equal(target);
      expect(acts).to.have.all.keys(def.concat('three'));
      var cnt = 0;
      acts.one.using(v=>cnt += v);
      acts.two.using(v=>cnt += 2 * v);
      acts.one(3);
      expect(cnt).to.equal(3);
      acts.two(3);
      expect(cnt).to.equal(9);
    });
    it('creates a new object if one is not supplied', function(){
      var def = ['one', 'two'];
      var acts = action.createOn(undefined, def, false);
      expect(acts).to.have.all.keys(def);
    })
  });
  describe('isAction', function(){
    it('tests if an object is an action or not', function(){
      expect(action.isAction({})).to.equal(false);
      expect(action.isAction(action.create())).to.equal(true);
    })
  });
  describe('ryleRegister', function(){
    it('provides a registration function for rylw', function(){
      let fn,ex;
      action.ryleRegister((f,e)=>{fn=f; ex=e});
      expect(fn).is.a('function');
      expect(ex).is.instanceOf(Array);
      const bnd = fn(ex[0]);
      expect(!!bnd).is.equal(true);
      let cnt=0;
      const cb=v=>cnt+=v;
      const clean=bnd(cb);
      expect(clean).is.a('function');
      expect(ex[0]._cb).is.equal(cb);
      expect(cnt).is.equal(0);
      ex[0].trigger(3);
      expect(cnt).is.equal(3);
      clean();
      ex[0].trigger(3);
      expect(cnt).is.equal(3);
    })
  })
});
