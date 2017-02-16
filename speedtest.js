/**
 * Created by euans on 05/02/2017.
 */
const Action=require('./action/action');
const sig=require('mini-signals');
var n,b;
var s = new sig();
var a = new Action();

a.on((s)=>console.log(s));
a.trigger('triggered!');
a.clear();
a.trigger('triggered!');


console.time('sig');
for(n=0;n<1000000;n++){
  b=s.add(()=>{});
  b.detach();
}
console.timeEnd('sig');

console.time('act');
for(n=0;n<1000000;n++){
  b=a.on(()=>{});
  a.clear();
}
a();
console.timeEnd('act');