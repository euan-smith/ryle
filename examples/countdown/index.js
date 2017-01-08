/**
 * Created by euans on 08/01/2017.
 */

var countdown=require('./countdown');

countdown(10)
  .then(function(){console.log('Boom!')})
  .catch(function(e){console.error(e)});