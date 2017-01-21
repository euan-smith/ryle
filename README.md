# Ryle
A full hierarchical Finite State Machine (fsm) library built on promises.

## What's a state machine?
A state machine is a way of describing a system based on its state, events and transitions.  In Ryle I'm implementing UML2 state machines and a good reference is [here](http://www.sparxsystems.com/resources/uml2_tutorial/uml2_statediagram.html).
## Why should I use a state machine?
It can help you design complex applications in a way which is more maintainable, simpler to understand and simpler to reason about.

[This article](https://engineering.shopify.com/17488160-why-developers-should-be-force-fed-state-machines) is a great descussion of why they should be used more and [this article](http://www.skorks.com/2011/09/why-developers-never-use-state-machines/) is a great response about the reasons developers don't end up using them when they should.
## Why should I use _this_ state machine library?
Yes, I know, there are a lot, and a couple of the others are great implementation.  These are some of the reasons you might like _this_ one.
- Ryle uses named objects rather than names in strings for transitions.
  - Less likely to have naming errors as the IDE can pick-up mistakes
- Can be used with any event, pubsub or signal libraries
  - Although, for the reasons above, we like signals.
- Properly hierarchical with all standard UML model state transitions supported
  - Nested state transitions fire exit and enter methods through the full path in order
  - A state can transition to itself and a parent state can define persistent transitions to sub-states.
- Reusable and composable
  - A state machine is defined once and then many instances of it can be run.
  - An existing state machine can be nested within another.
  - Abstract states can be defined which are then instantiated by a parent machine.

Above all I found many of the other fsm libraries required machine definition code which was not easy to read.
The easier code is to read then in general it is simpler to maintain and for others to follow.  I've tried to make resultant state definition code to be as readable as possible.

## Why call it Ryle?
I wanted to base the name on the phrase ['Ghost in the Machine'](https://en.wikipedia.org/wiki/Ghost_in_the_machine) which originated from the book ['The Concept of Mind'](https://en.wikipedia.org/wiki/The_Concept_of_Mind) by Gilbert Ryle, a British Philosopher.
   Ghost was already taken.
   
## Installation
```
  npm install ryle --save
```

## Usage

Check out the [API reference](api.md).  Below is a simple example:

### Countdown Example

Implements the following state machine:

![Countdown state machine](./examples/countdown.uxf.png)

There are two states, tick and done.  Simple arrows are automatic transitions, 
for example from the initial state (the black dot) to the _tick_ state.
A square brackets indicate a condition which must be met for the transition
to occur, known as a guard.  Other text with a transition indicates the event which triggers the transition.

The first step is to require _ryle_.
  
```
var ryle=require('ryle');
```
Then the state machine gets defined by passing a machine definition to _ryle_.  I'll show this code first without comments
so it can be seen how concise the machine definition can be.


```
var countdown=ryle({
  get _start(){return this.tick},

  tick: function(context){
    console.log(context.value);
    return ryle
      .on(!context.value,this.done)
      .onTimeout(1000, this.tick)
      .onExit(function(){--context.value});
  },

  done: function(){
    return ryle.exit();
  }
});
```
The only required property of a machine definition is a `_start` getter function which returns the (default) initial state.
The states are defined as methods which take `context` as a variable which is a container for properties
of the machine, in this case just an initial `context.value`.  When a state is entered the state function executes.
The return value, chained from the _ryle_ object, defines the transitions. `.on(<condition>,<state>)` will immediately transition
to the _state_ if the _condition_ resolves true.  `.onTimeout(<ms>,<state>)` will transition to the _state_ once the specified time
has passed.  `.onExit(<function>)` records a function to be run when the state exits.

When the machine is run it returns a promise which resolves once the state machine has exited (and which will reject on any errors thrown).
So, to run the machine:
```
countdown(10).then(function(){console.log('Boom!')}); 
```  
which will give you the output:
```
10
9
8
7
6
5
4
3
2
1
0
Boom!
``` 
There are more examples and explanation of the rest in the [API documentation](api.md)


## Tests
 
```
   npm test
```

## Contributing
 In lieu of a formal styleguide, take care to maintain the existing coding style.
 Add unit tests for any new or changed functionality. Lint and test your code.

## Notes
I'm refactoring this from code I use for our production web-app.  So far it has been added as-is and is fully functional, but needs a little TLC to make it more maintainable.

## Release History
- 0.1.0 Initial release