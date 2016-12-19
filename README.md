Ryle
====
A full hierarchical Finite State Machine (fsm).

I'm refactoring this from code I use for our production web-app, so still in development.

##What?  Another state machine library?
Yes, I know, there are a lot.  This has a lot of the features of the others, plus a few more (I think):
- Understands, and is built on, promises.
- Can be used with any event, pubsub or signal libraries
- Properly hierarchical with all standard UML model state transitions supported
  - Nested state transitions fire exit and enter methods through the full path in order
  - A state can transition to itself and a parent state can define persistent transitions to sub-states.
- Reusable
  - A state machine is composed and then several instances of it can be run.
  - Composed machines can be used to create library methods and the user does not need to know that it is a state machine under the hood.
- Extensible
  - A given state machine can be extended, adding and overriding existing states.
  - Similarly, if desired, a state machine can be declared to be not extensible
- State machines can be composed
  - An existing state machine can be nested within another.
  - Virtual states can be defined which are then instantiated by a parent machine.

Above all I found many of the other fsm libraries required machine definition code which was not easy to read.
The easier code is to read then in general it is simpler to maintain and for others to follow.  I've tried to make resultant state definition code to be as readable as possible.

##Why Ryle?
This is based on the phrase 'The Ghost in the Machine' which originated from 'A Concept of Mind' by Gilbert Ryle, a British Philosopher.   
## Installation
  npm install ryle --save

##Usage
  
```
  var Ryle=require('ryle');
  
  //define the context, the data object with the state machine can modify 
  //and the public interface to the machine.
  //A constructor is used so that a new context is made per instance. 
  function Context(start){
    this.seconds=start || 10;
  }
  
  //now define the state machine
  var fsm={
  
    //the start must be a getter function returning the initial promise
    get _start(){return this.tick},
    
    //this is the main state.  It transitions to itself every second and to done when complete
    tick(context){
      --context.seconds;
      return Ryle.on(!context.seconds,this.done).onTimeout(1000, this.tick);
    },
    done(){
      return Ryle.exit();
    }
  }

  //add a public method to the interface
  Context.prototype={
    onTick(fn){
      fsm.tick.onEnter(this,fn);
    }
  }
 
  //Define the machine
  var Stopwatch = Ryle.extend({Context, fsm});
  
  //Now to use the state machine
  
  //Create an instance
  var countdown = new Stopwatch(60);
  //Listen for the tick
  countdown.onTick(()=>console.log(countdown.seconds));
  //And react when the state machine is done
  countdown.then(()=>console.log('done!'));
 
```  
 
## Tests
 
```
   npm test
```
## Contributing
 In lieu of a formal styleguide, take care to maintain the existing coding style.
 Add unit tests for any new or changed functionality. Lint and test your code.

## Release History
none yet!