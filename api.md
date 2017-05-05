# Ryle API

1. [Ryle global object](#ryle)
    1. [ryle()](#ryle-fn) ⇒ <code>[Machine](#machine)</code>
    2. [ryle.on()](#ryle-on) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    3. [ryle.onTimeout()](#ryle-on-timeout) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    4. [ryle.onExit()](#ryle-on-exit) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    5. [ryle.using()](#ryle-using) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    6. [ryle.exit()](#ryle-exit) ⇒ <code>[TransitionResult](#transition-result)</code>
    7. [ryle.abstract()](#ryle-abstract) ⇒ <code>[State](#state)</code>
2. [State Machine Definition](#machine-def)
    1. [State Definition](#state)
    2. [$createContext](#create-context)
    3. [$start](#start)
    4. [$superstate](#superstate)
3. [State Machine](#machine) <code>\<Function></code>
    1. [machine::()](#machine-fn) ⇒ <code>[Context](#context)</code>
4. [Context](#context) <code>\<Promise></code>
    1. [context::exit()](#context-exit) ⇒ <code>Promise</code>
5. [Transition Collection](#transition-collection)
    1. [transitionCollection::onTimeout(...)](#transition-collection-on-timeout) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    2. [transitionCollection::onExit(...)](#transition-collection-on-exit) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    3. [transitionCollection::using(...)](#transition-collection-using) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    4. [transitionCollection::on(...)](#transition-collection-on) ⇒ <code>[TransitionCollection](#transition-collection)</code>
    5. [Custom transition triggers](#custom-triggers)
6. [Transition Result](#transition-result)
7. [Action](#action)
7. [Examples](#examples)

<a name="ryle"></a>
## Ryle global object

The ryle global object is both the [machine](#machine) [factory function](#ryle-fn) and a container object for
the helper functions needed to define a state machine.  A ryle machine is itself a factory function which initiates a
new instance of a state machine and returns the [context](#context) which is the interface to a
running state machine.

**Example**
```js
const ryle=require('ryle');

//define a state machine
const foo=ryle({
  //state machine definition
  //...
});

//make two instances of a foo machine
const foo1=foo();
const foo2=foo();

foo1.then(()=>{
  //do something once foo1 is done
});

//force foo2 to exit
foo2.exit();
```

<a name="ryle-fn"></a>
### ryle ([transition_definitions,] machine_definition) ⇒ <code>[Machine](#machine)</code>

Creates a [state machine](#machine) function.

**Parameters**

|Parameter|type|description|
|---|---|---|
|trigger_definitions (optional)|<code>Array.\<[trigger-definition](#custom-triggers)></code>|
|machine_definition|[state machine definition](#machine-def)|

<a name="ryle-on"></a>
### ryle.on(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>
A initiates a [transition collection](#transition-collection) and calls its `.on` method.
See [transitionCollection.on](#transition-collection-on) for more details.

<a name="ryle-on-timeout"></a>
### ryle.onTimeout(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>
A initiates a [transition collection](#transition-collection) and calls its `.onTimeout` method.
See [transitionCollection.onTimeout](#transition-collection-on-timeout) for more details.

<a name="ryle-on-exit"></a>
### ryle.onExit(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>
A initiates a [transition collection](#transition-collection) and calls its `.onExit` method.
See [transitionCollection.onExit](#transition-collection-on-exit) for more details.

<a name="ryle-using"></a>
### ryle.using(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>
A initiates a [transition collection](#transition-collection) and calls its `.using` method.
See [transitionCollection.using](#transition-collection-using) for more details.

<a name="ryle-exit"></a>
### ryle.exit([result]) ⇒ <code>[TransitionResult](#transition-result)</code>
Returns a [transition result](#transition-result) which, if returned by a state function,
will cause the state machine to make an orderly exit (cleaning up and calling onExit methods as it goes)
and cause the state machine instance [context](#context) to resolve.

|Parameter|type|description|
|---|---|---|
|result (optional)|any|The value with which the state machine instance [context](#context) will resulve.

*usage example*
```js
const myFsm = ryle({
  //...
  done(){
    //exit the state machine with a result
    return ryle.exit("OK!");
  }
})
```
More examples using `ryle.exit()`: [countdown](#examples-countdown)

<a name="ryle-abstract"></a>
### ryle.abstract() ⇒ <code>[State](#state)</code>
Returns a [state](#state) without a concrete definition.
For use with  [transitionCollection.using](transition-collection-using).
Any transition to an abstract state _must_ be caught in a containing state machine otherwise an error will be thrown.
See [composable state machines](composable-state-machines) for more details.

*usage example*
```js
const foo = ryle({
  //...
  result: ryle.abstract()
});

const bar = ryle({
  //...
  doFoo(){
    //enter the foo state machine
    return ryle.using(foo).on(foo.result, this.fooResult);
  },
  
  fooResult(){
    //The foo state machine has exited with the 'result' abstract state 
  }
});
```
More examples using `ryle.abstract()`: [composable machine](#examples-composable)

<a name="machine-def"></a>
## State Machine Definition

<a name="state"></a>
### State Definition

<a name="create-context"></a>
### $createContext

<a name="start"></a>
### $start

<a name="superstate"></a>
### $superstate

<a name="machine"></a>
## State Machine <code>\<Function></code>

<a name="machine-fn"></a>
### machine([...various]) ⇒ <code>[Context](#context)</code>

<a name="context"></a>
## Context <code>\<Promise></code>

<a name="context-exit"></a>
### context.exit() ⇒ <code>Promise</code>

<a name="transition-collection"></a>
## Transition Collection

<a name="transition-collection-on-timeout"></a>
### transitionCollection.onTimeout(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>

<a name="transition-collection-on-exit"></a>
### transitionCollection.onExit(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>


<a name="transition-collection-using"></a>
### transitionCollection::using(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>


<a name="transition-collection-on"></a>
### transitionCollection::on(...) ⇒ <code>[TransitionCollection](#transition-collection)</code>


<a name="custom-triggers"></a>
### Custom transition triggers


<a name="transition-result"></a>
## Transition Result


<a name="action"></a>
## Action


<a name="examples"></a>
## Examples

<a name="examples-countdown"></a>
### Countdown
This state machine counts down a given number of seconds.

**Definition Functions**

|Function|Description|
|---|---|
|[$createContext](#create-context) | A standard function.  Is passed the arguments used when the state machine is called and returns a context instance.
|[$start](#start)| A standard function.  A state which transitions to the starting state.
|tick| A state function.  Reports the number of seconds remaining and if ticks===0 transition to the done state. After 1 second will transition back to itself and on each exit will reduce the ticks remaining by 1.  
|done| A state function.  Exits the state machine

**UML diagram**

![Countdown state machine](./examples/countdown.uxf.png)

**examples/countdown.js**
```js
const ryle = require('ryle');

const countdown=ryle({
  $createContext(ticks){
    return {ticks};
  },
  
  $start(){
    return this.tick
  },

  tick: function(context){
    console.log(context.ticks);
    return ryle
      .on(!context.ticks,this.done)
      .onTimeout(1000, this.tick)
      .onExit(function(){--context.ticks});
  },

  done: function(){
    return ryle.exit();
  }
});
```