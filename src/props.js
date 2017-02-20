/**
 * Created by euans on 14/02/2017.
 */

/**
 * @module props
 */

/**
 * @class
 */
class Prop {

  /**
   * initiates a property descriptor with a value with it writable, enumerable but not reconfigurable
   * @constructor
   * @param val the initial value
   */
  constructor(val) {
    this.writable = true;
    this.enumerable = true;
    this.configurable = false;
    this.value = val;
    return this;
  }

  /**
   * make a property not enumerable
   * @returns {Prop}
   */
  hide() {
    this.enumerable = false;
    return this;
  }

  /**
   * Create a new instance of a property each time.
   * @param {function} getter - a function which returns a new object
   */
  create(getter) {
    if (typeof getter !== 'function') throw new TypeError('Parameter must be a function');
    Object.defineProperty(this, 'value', {get: getter});
    return this;
  }

  /**
   * make a property not writable
   * @returns {Prop}
   */
  fix() {
    this.writable = false;
    return this;
  }

  /**
   * make a property configurable
   * @returns {Prop}
   */
  thaw() {
    this.configurable = true;
    return this;
  }
}

/**
 * initiates a property descriptor with a value with it writable, enumerable but not reconfigurable
 * @param val
 */
//exports.prop = val => new Prop(val);

// exports.defineProperties = (obj, props) => {
//   for(let p of Object.keys(props)){
//     Object.defineProperty(obj, p, Object.assign({},props[p]));
//   }
// };


const defaultProp = {
  writable: true,
  enumerable: true,
  configurable: false,
  value: undefined
};

function makeTarget(){
  const target = function (val, isMethod = false) {
    var rtn = new Prop2(target);
    if (arguments.length > 0) {
      if (typeof val === 'function' && !isMethod) {
        Object.defineProperty(rtn, 'value', {get: val});
      } else {
        Object.defineProperty(rtn, 'value', {value: val});
      }
    }
    return rtn;
  };
  return target;
}

class Prop2 extends Function {
  static makeRoot(props){
    const rtn = makeTarget();
    for (let k of Object.keys(props)) {
      const d = Object.getOwnPropertyDescriptor(props, k);
      d.configurable = false;
      d.writable = false;
      Object.defineProperty(rtn, k, d);
    }
    return rtn;
  }

  static create(props){
    const rtn = makeTarget();
    Object.setPrototypeOf(rtn, Prop2.prototype);
    Object.assign(rtn, props);
    Object.defineProperty(rtn, 'value', Object.getOwnPropertyDescriptor(props, 'value'));
    return rtn;
  }

  get hidden() {
    this.enumerable = false;
    return this
  }

  get visible() {
    this.enumerable = true;
    return this
  }

  get constant() {
    this.writable = false;
    return this
  }

  get variable() {
    this.writable = true;
    return this
  }

  get frozen() {
    this.configurable = false;
    return this
  }

  get thawed() {
    this.configurable = true;
    return this
  }
}

exports.prop = new Prop2(defaultProp, true);
