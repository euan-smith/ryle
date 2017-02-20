/**
 * Created by euans on 14/02/2017.
 */

/**
 * @module props
 */


const defaultProp = {
  writable: true,
  enumerable: true,
  configurable: false,
  value: undefined
};

class Prop extends Function {
  static makeRoot(props) {
    const rtn = makeTarget();
    for (let k of Object.keys(props)) {
      const d = Object.getOwnPropertyDescriptor(props, k);
      d.configurable = false;
      d.writable = false;
      Object.defineProperty(rtn, k, d);
    }
    return rtn;
  }

  static create(props) {
    const rtn = Prop.makeTarget();
    Object.setPrototypeOf(rtn, Prop.prototype);
    Object.assign(rtn, props);
    Object.defineProperty(rtn, 'value', Object.getOwnPropertyDescriptor(props, 'value'));
    return rtn;
  }

  static makeTarget() {
    const target = function (val, isMethod = false) {
      var rtn = Prop.create(target);
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

exports.prop = Prop.makeRoot(defaultProp);
