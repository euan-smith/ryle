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
  constructor(val){
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
  hide(){
    this.enumerable = false;
    return this;
  }

  /**
   * make a property not writable
   * @returns {Prop}
   */
  fix(){
    this.writable = false;
    return this;
  }

  /**
   * make a property configurable
   * @returns {Prop}
   */
  thaw(){
    this.configurable = true;
    return this;
  }
}

/**
 * initiates a property descriptor with a value with it writable, enumerable but not reconfigurable
 * @param val
 */
exports.prop = val => new Prop(val);
