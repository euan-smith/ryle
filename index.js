/**
 * Created by euans on 18/12/2016.
 */

//Still using the old code with a hack-around
var ryle=require('./src/fsm-old.js');

//quick fix for an exit function
ryle.exit=function(v){return v===undefined?{}:v};


//add in the actions and bind them
var actionLib=require('./src/action');
ryle.action=actionLib.create;
actionLib.register(ryle);

module.exports=ryle;