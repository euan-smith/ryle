/**
 * Created by EuanSmith on 19/04/2016.
 */


var a = require('../src/action');
require('chai').should();

describe('action', function () {
    it('creates an action which can be subscribed to and triggered', function (done) {
        var act = a.action();
        var cnt = 0;
        var fn1=function () {
            cnt++;
        };
        var fn2=function () {
            cnt+=10;
        };
        act.on(fn1);
        act.on(fn2);
        act();
        cnt.should.equal(11);
        act.off(fn1);
        act();
        cnt.should.equal(21);
        act.off();
        act();
        cnt.should.equal(21);
        act.on(function(a,b,c){
            a.should.equal(1);
            b.should.equal(2);
            c.should.equal('test');
            this.test.should.equal('this');
            done();
        });
        act.call({test:'this'},1,2,'test');
    });
    it('creates an object of actions constructed from an array',function(){
        var def=['one','two'];
        var acts= a.actions(def);
        var cnt=0;
        acts.should.have.all.keys(def);
        var fn1=function () {
            cnt++;
        };
        var fn2=function () {
            cnt+=10;
        };
        acts.one.on(fn1);
        acts.two.on(fn2);
        acts.one();
        cnt.should.equal(1);
        acts.two();
        cnt.should.equal(11);
    })
});