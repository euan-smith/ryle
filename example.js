/**
 * Created by euans on 19/12/2016.
 */

var ryle=require('.');

//define a state machine
var countdown=ryle({

  //the start must be a getter function returning the initial state
  get _start(){return this.tick},

  //this is the main state.  It transitions to itself every second and to done when complete
  tick: function(context){
    console.log(context.value);
    return ryle
      .on(!context.value,this.done)
      .onTimeout(1000, this.tick)
      .onExit(function(){--context.value});
  },
  done: function(){
    return ryle.exit();
  }
});

//Now to use the state machine
countdown(10).then(function(){console.log('Boom!')});
