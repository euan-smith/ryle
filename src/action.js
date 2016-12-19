/**
 * Created by EuanSmith on 18/04/2016.
 */

var GUID = require('./guid');
var addListener = GUID.addListener;
var removeListener = GUID.removeListener;


//NOTES:
//The advantages of this 'class' is that it creates an interface which looks like a plane function
//but which can be listened to.  The on and off methods are also portable can be moved onto a private object
//The downside is that new instances of each function are added each and every time a new action is created.
//This is fine if they are few - but that is the point, too much proliferation would be a problem.

function action(cb) {
  var listeners = {};
  var target = function () {
    var i, names = Object.keys(listeners);
    for (i = 0; i < names.length; i++) {
      listeners[names[i]].apply(this, arguments);
    }
    target.last=[];
    for (i=0;i<arguments.length;i++){
      target.last[i]=arguments[i];
    }
  };
  target.on = function (fn) {
    var rtn;
    if (!fn) {
      return (new Promise(function (resolve) {
        rtn = addListener(listeners, resolve);
      })).then(function (r) {
        rtn.off();
        return r;
      });
    }
    rtn = addListener(listeners, fn);
    if (cb) cb();
    return rtn;
  };
  target.off = function (fn) {
    if (fn) {
      removeListener(listeners, fn);
    } else {
      listeners = {};
    }
    if (cb) cb();
  };
  target._listeners = listeners;
  Object.defineProperty(target, 'count', {
    get: function () {
      return listeners.count;
    }
  });
  return target;
}

function actions(list, targ) {
  var rtn = targ || {};
  list.forEach(function (name) {
    rtn[name] = action();
  });
  return rtn;
}

module.exports = {action: action, actions: actions};

//the following piece of code is a lighter alternative to the action above.  The main difference is that the methods
//cannot be moved to different object, not that there seemed to be a particular use for that.

var actionPrototype={
  add: function(fn){
    var rtn=addListener(self._listeners, fn);
    if (self._onChange) self._onChange();
    return rtn;
  },
  remove: function(fn){
    if (fn){
      removeListener(this._listeners, fn);
    } else {
      this._listeners = {};
    }
    if (self._onChange) self._onChange();
  },
  dispatch: function(){
    var names = Object.keys(this._listeners);
    for (var i = 0; i < names.length; i++) {
      this._listeners[names[i]].apply(this, arguments);
    }
  },
  promise: function(){
    var rtn, self=this;
    return (new Promise(function(resolve){
      rtn=self.add(resolve);
    })).then(function(r){
      rtn.off();
      return r;
    });
  },
  on: function(fn){
    if (!fn){
      return this.promise();
    }
    return this.add(fn);
  },
  off: function(fn){
    return this.remove(fn);
  },
  get count(){
    return this._listeners.count;
  }
};
function actionFactory(cb){
  var rtn=function i(){
    i.dispach.apply(i, arguments);
  };
  require('./objects').extend(rtn,actionPrototype);
  rtn._listeners={};
  rtn._onChange=cb;
}
