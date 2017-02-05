/**
 * Created by EuanSmith on 18/04/2016.
 */

var GUID = require('../src/guid');
var extend = require('../src/objects').extend;
var addListener = GUID.addListener;
var removeListener = GUID.removeListener;

var actionPrototype={
  add: function(fn){
    var rtn=addListener(this._listeners, fn);
    if (this._onChange) this._onChange();
    return rtn;
  },
  remove: function(fn){
    if (fn){
      removeListener(this._listeners, fn);
    } else {
      this._listeners = {};
    }
    if (this._onChange) this._onChange();
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
    var names = Object.keys(i._listeners);
    for (var n = 0; n < names.length; n++) {
      i._listeners[names[n]].apply(this, arguments);
    }
  };
  extend(rtn,actionPrototype);
  rtn._listeners={};
  rtn._onChange=cb;
  return rtn;
}

function actions(list, targ) {
  var rtn = targ || {};
  list.forEach(function (name) {
    rtn[name] = actionFactory();
  });
  return rtn;
}

module.exports = {action: actionFactory, actions: actions};