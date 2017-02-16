/**
 * Created by euans on 08/01/2017.
 */

const service=require('./longRestService');

const longRest=require('./longRest');

//to show the reuse value
var proms=[];
for (var i=0; i<10; i++){
  proms.push(function(i){
    var j="job "+i;
    console.time(j);
    return longRest()
      .then(r=>{
        console.timeEnd(j);
        console.log(j+' result: '+r);
      })
  }(i));
}
Promise.all(proms)
  .catch(function(e){console.error(e)})
  .then(()=>service.close());
