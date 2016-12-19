/**
 * Created by EuanSmith on 04/05/2016.
 */

//bind the actions to the fsm promises
//This binding module is a separate require so that this code is only called once.
//it COULD have been included in action.js, but then fsm2.js would have been included if it were needed or not

var fsm=require('./fsm-old');
var action=require('./action');

//this defines the simple case of fsm.on(action, transitionTo)
fsm.defineOn(
    function(act, resolve){
        act.on(resolve);
        return function(){act.off(resolve)};
    },
    function(act){
        return arguments.length===2 && act.on && act.off;
    },
    [action.action()]
);

//a guarded version fsm.on(onAction, ifConditionFn, transitionTo)
fsm.defineOn(
    function(act, cond, resolve){
        //on the action if the condition is true then resolve to the return value, else reform the action and try again
        function prom(rslt){
            if (cond()) resolve(rslt);
        }
        act.on(prom);
        return function(){act.off(prom)};
    },
    function(act, cond){
        return arguments.length===3 && act.on && act.off && (cond instanceof Function);
    },
    [action.action(), function(){return true}]
);

