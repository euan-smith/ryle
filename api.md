# Ryle API

1. [State Machine Declaration](#state-machine-declatation)
   1. [Machine Structure](#machine-structure)
   1. [Machine Object](#machine-object)
   1. [Machine Instance](#machine-instance)
1. [Defining a State](#defining-a-state)
   1. [On Entry](#on-entry)
   1. [On Exit](#on-exit)
   1. [Transitions](#transitions)
   1. [Binding Events](#binding-events)
   1. [Hooks](#hooks)
1. [Hierarchical Machines](#hierarchical-machines)
1. [Composable Machines](#composable-machines)
1. [Examples](#examples)
   1. [Countdown](#countdown)
   1. [Long REST](#long-rest)
   1. [Door](#door)

## State Machine Declaration

A state machine is declared, after requiring `ryle`, with:
```javascript
const machineObject = ryle(machineStructure);
```
An active instance of a machine is created with:
```javascript
const machineInstance = machineObject(<params>)
```
The first section below deals with the machine structure, object and instance are described in the following sections.

### Machine Structure
The machine structure passed to `ryle` is a javascript object containing the state definitions.  The only thing it _must_
contain is a getter function called `_start` which returns the initial state.  Clearly the machine is not a lot of use
if it does not also contain any states, however `ryle` will only throw an error in the absence of a `_start`.

So, the simplest structure:
```javascript
const machineObject = ryle({
  get _start(){return this.initial},
  initial(context){
    //state definition
  },
  //other states
});
```
Why must `_start` be a getter rather than just a simple value?  Typically the object passed to `ryle` is anonymous and
using a getter provides a `this` which points to the definition object.  Why not just use strings? For the same reasons
described [here](http://millermedeiros.github.io/js-signals/) for the js-signals library.  In essence, and particularly
for a large state machine, string names can't be checked by your IDE and don't throw an error if they are wrong whereas
returning real object (and using signals instead of events) _can_ be caught by your IDE and _will_ throw an error if you
get them wrong.
### Machine Object
The _machine object_ is a function which can initiate the state machine.  The object has all the states attached which
were supplied with the definition.  For example in the above code block `machineObject.initial` will be the state function.
All of the state functions, and the _machine object_ itself have the following methods:

asd | asd | asd
--- | --- | ---
dfdf | dfdf | dfdf

  target.onEnter = onEnter;
  target.onExit = onExit;
  target.onceActive = onceActive;
  target.getState = getState;
  target.using = using;

### Machine Instance

## Defining a State

### On Entry

### On Exit

### Transitions

### Binding Events

### Hooks

## Hierarchical Machines

## Composable Machines
