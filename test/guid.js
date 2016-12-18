/**
 * Created by EuanSmith on 20/04/2016.
 */

/**
 * Created by EuanSmith on 19/04/2016.
 */
var chai=require('chai');
chai.should();
var expect=chai.expect;
var guid=require('../src/guid');

describe('guid',function(){
    it('attaches a unique guid to a function if absent', function(){
        var fn1=function(){};
        var fn2=function(){};
        var fn3=function(){};
        guid.ensureGUID(fn1);
        guid.ensureGUID(fn2);
        guid.ensureGUID(fn3);
        guid.getGUID(fn1).should.not.equal(guid.getGUID(fn2));
        guid.getGUID(fn2).should.not.equal(guid.getGUID(fn3));
        guid.getGUID(fn3).should.not.equal(guid.getGUID(fn1));
        var a=guid.getGUID(fn1);
        guid.ensureGUID(fn1);
        guid.getGUID(fn1).should.equal(a);
    });
    it('adds a listener, avoiding duplicates', function(){
        var cnt=0;
        var fn1=function(){cnt++};
        var fn2=function(){cnt+=10};
        var arr={};
        guid.addListener(arr,fn1);
        var r2=guid.addListener(arr,fn2);
        guid.addListener(arr,fn2);
        Object.keys(arr).length.should.equal(2);
        guid.callListeners(arr);
        cnt.should.equal(11);
        guid.removeListener(arr,{});//should do nothing
        Object.keys(arr).length.should.equal(2);
        r2.off();
        guid.callListeners(arr);
        cnt.should.equal(12);
        guid.removeListener(arr,fn1);
        guid.callListeners(arr);
        cnt.should.equal(12);
    });
    it('checks if an object is present in a store', function(){
        var store={};
        var obj={};
        expect(guid.present(store,obj)).to.equal(false);
        guid.add(store,obj);
        expect(guid.present(store,obj)).to.equal(true);
        guid.remove(store,obj);
        expect(guid.present(store,obj)).to.equal(false);
    })
});