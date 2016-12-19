/**
 * Created by euans on 18/12/2016.
 */

//Still using the old code with a hack-around
var ryle=require('./src/fsm-old.js');

//quick fix for an exit function
ryle.exit=function(v){return v===undefined?{}:v};

module.exports=ryle;