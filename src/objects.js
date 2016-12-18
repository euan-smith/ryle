/**
 * Created by EuanSmith on 19/04/2016.
 */

/**
 * Calls the provided function for each property owned by the specified object
 * exits the loop if true is returned
 * @param {Object} obj the object containing the properties
 * @param {function} fn a function called with each property and its name
 */
function each(obj, fn) {
    var names=Object.keys(obj), i, l=names.length, name;
    for(i=0;i<l;i++){
        name=names[i];
        if (fn(obj[name],name))break;
    }
}

function map(obj, fn){
  var rtn={};
  each(obj, function(prop, key){
    rtn[key]=fn(prop, key);
  });
  return rtn;
}

function eachProp(obj, fn) {
    var names=Object.keys(obj), i, l=names.length, name;
    for(i=0;i<l;i++){
        name=names[i];
        if (fn(name,Object.getOwnPropertyDescriptor(obj, name)))break;
    }
}

function findFirst(obj, fn){
    var names=Object.keys(obj), i,l=names.length, name, prop;
    for(i=0;i<l;i++){
        name=names[i]; prop=obj[name];
        if (fn(prop,name)) return prop;
    }
}

//Deep copy
//if attached to an object it will be able to extend that object
//e.g. myclass.extend=extend
//     myclass.extend({obj}) will now attach the properties of obj to myclass
const extTag='__ext_tag';
function deepExtend() {
    var target, i, args = arguments, len = args.length;
    if (!len) return;
    if (len === 1) {
        target = this;
        i = 0;
    } else {
        target = args[0];
        i = 1;
    }
    while (i < len) {
        var src = args[i];
        //tag the property so that circular references are dealt with
        Object.defineProperty(src,extTag,{value: target, enumerable: false, writable: true});
        eachProp(src, function (name, descriptor) {
            //deal with circular defines
            if (descriptor.value && descriptor.value.hasOwnProperty(extTag) && descriptor.value[extTag]){
                //make the circular reference point to the same point in the target rather than the source
                target[name]=descriptor.value[extTag];
            //otherwise if the property is an object, recurse
            } else if (
              descriptor.value &&
              descriptor.value.constructor === Object
            ){
              //work of the descriptor value rather than the accessor
              var targVal;
              if (!target.hasOwnProperty(name) || !(targVal=Object.getOwnPropertyDescriptor(target, name).value) instanceof Object) targVal=target[name]={};
              deepExtend(targVal, descriptor.value);
            } else Object.defineProperty(target, name, descriptor);
        });
      //NOTE: this cleanup means that duplicate references in leaves do not end up pointing at the same object
      //removing this would mean that they do, but would also mean that the source object would be populated with tags
      //and might do something unfortunate if extended again.
      //The solution is to have a simpler recursion function and then expressly go back through a source object removing links.
        src[extTag]=undefined;
        i++;
    }
    return target;
}


//Shallow copy version. Same form as $.extend otherwise
//if attached to an object it will be able to extend that object
//e.g. myclass.extend=extend
//     myclass.extend({obj}) will now attach the properties of obj to myclass
function extend() {
  var target, i, args = arguments, len = args.length;
  if (!len) return;
  if (len === 1) {
    target = this;
    i = 0;
  } else {
    target = args[0];
    i = 1;
  }
  while (i < len) {
    var src = args[i];
    eachProp(src, function (name, descriptor) {
      Object.defineProperty(target, name, descriptor);
    });
    i++;
  }
  return target;
}


//http://stackoverflow.com/a/6713782/4098951
function equal( x, y ) {
    if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

    if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test their constructor.

    for ( var p in x ) {
        if ( ! x.hasOwnProperty( p ) ) continue;
        // other properties were tested using x.constructor === y.constructor

        if ( ! y.hasOwnProperty( p ) ) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if ( ! equal( x[ p ],  y[ p ] ) ) return false;
        // Objects and Arrays must be tested recursively
    }

    for ( p in y ) {
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
        // allows x[ p ] to be set to undefined
    }
    return true;
}

function getFilterFn(filt){
    var regex;
    if (filt instanceof RegExp) return filt.test.bind(filt);
    else if (typeof filt === 'string') return (regex=new RegExp(filt)).test.bind(regex);
    else if (filt.indexOf) return function(str){return filt.indexOf(str)>=0};
    return filt;
}

function filter(obj, filt, byValue, negate){
    var rtn = {}, fn=getFilterFn(filt);
    if (byValue){
        each(obj, function(val, name){
            if (negate?!fn(name):fn(name)) rtn[name]=val;
        });
    } else {
        eachProp(obj, function (name, descriptor) {
            if (negate?!fn(name):fn(name)) Object.defineProperty(rtn, name, descriptor);
        });
    }
    return rtn;
}

function filterOut(obj, filt, byValue) {
    return filter(obj, filt, byValue, true);
}

/**
 * Generator to allow iterating over object properties.
 *
 * @see http://exploringjs.com/es6/ch_generators.html
 *
 * @param obj
 */
// function* objectEntries(obj) {
//   const propKeys = Reflect.ownKeys(obj);
//
//   for (const propKey of propKeys) {
//     // `yield` returns a value and then pauses
//     // the generator. Later, execution continues
//     // where it was previously paused.
//     yield [propKey, obj[propKey]];
//   }
// }

module.exports = {
    each: each,
    map: map,
    eachProp: eachProp,
    equal: equal,
    extend: extend,
    filter: filter,
    filterOut: filterOut,
    findFirst: findFirst,
    deepExtend: deepExtend
    // objectEntries: objectEntries
};
