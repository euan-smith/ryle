/**
 * Created by euans on 27/12/2016.
 */

var ryle=require('../');

function Context(){
  this.red=null;
  this.amber=null;
  this.green=null;
  this.actions=ryle.actions(['go','stop']);
  this.signals=ryle.actions(['going','stopped']);
}

var fsm=ryle({
  get _start(){return this.stop},

  stop: function(context){
    context.red=true;
    context.amber=false;
    context.green=false;
    return ryle.on(context.actions.go, this.prepareToGo);
  },

  prepareToGo: function(context){
    context.red=true;
    context.amber=true;
    context.green=false;
    return ryle.onTimeout(3000, this.go);
  },

  go: function(context){
    context.red=false;
    context.amber=false;
    context.green=true;
    return ryle.on(context.actions.stop, this.prepareToStop);
  },

  prepareToStop: function(context){
    context.red=false;
    context.amber=true;
    context.green=false;
    return ryle.onTimeout(3000, this.prepareToStop);
  }
});

module.exports={Context:Context, fsm:fsm};
