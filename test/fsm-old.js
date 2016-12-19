/**
 * Created by euans_000 on 25/04/2016.
 */


var fsm = require('../src/fsm-old');
var action = require('../src/action');
require('../src/action-binding');
var chai=require('chai');
chai.should();
chai.use(require('chai-as-promised'));

fsm.debug=false;


describe('yet another machine with promises', function () {
  it('provides chainable methods for building transitions', function (done) {
    var c = fsm.on();
    c._trans.length.should.equal(0);
    c.on(new Promise(function () {
    }));
    c._trans.length.should.equal(1);
    var a = action.action();
    c._defs.length.should.equal(0);
    c.on(a, 'test');
    c._defs.length.should.equal(1);
    c._race().then(function (rslt) {
      rslt._state.should.equal('test');
      rslt._data.should.equal('value');
      done();
    }).catch(done);
    a('value');
  });
  it('builds a simple state machine', function (done) {
    var factorial = fsm({
      get _start() {
        return this.init
      },
      init: function (context) {
        context.out = 1;
        return this.calc;
      },
      calc: function (context) {
        context.out *= context.value--;
        return context.value > 1 ? this.calc : context.out;
      }
    });
    factorial(5).then(function (v) {
      v.should.equal(120);
      done();
    });
  });
  it('builds a state machine with delayed transitions', function () {
    var clock = fsm({
      _superState: function (context) {
        context.tickCount = 0;
        context.tockCount = 0;
      },
      _record: function (context, state) {
        context.state = state;
      },
      get _start() {
        return this.tick;
      },
      tick: function (context) {
        context.tickCount++;
        return fsm.onTimeout(10, this.tock);
      },
      tock: function (context) {
        context.tockCount++;
        if (context.tockCount === 5) return context;
        return fsm.onTimeout(10, this.tick);
      }
    });
    return clock({}).then(function (context) {
      context.tickCount.should.equal(5);
      context.tockCount.should.equal(5);
    });
  });
  it('builds a hierarchical state machine', function () {
    var context = {
      actions: action.actions(['login', 'logout', 'cancel', 'setname', 'password']),
      getName: function () {
        var self = this;
        return new Promise(function (r) {
          self.actions.setname.on(function (name) {
            r(name)
          });
        });
      },
      getPassword: function () {
        var self = this;
        return new Promise(function (r) {
          self.actions.password.on(function (key) {
            r(key)
          });
        });
      }
    };

    var userAuth = fsm({
      _superState: function (context) {
        context.list = [];
        context.list.push(0);
      },
      get _start() {
        return this.unauthorised;
      },
      unauthorised: function (context) {
        context.list.push(1);
        return context.username ?
          fsm.on(Promise.resolve(context.username), this.login.gotName) :
          fsm.on(context.actions.login, this.login);
      },
      login: {
        _superState: function (context) {
          context.list.push(2);
          return fsm
            .on(context.actions.cancel, userAuth.unauthorised)
            .onExit(function () {
              context.list.push(29)
            });
        },
        get _start() {
          return this.getName;
        },
        getName: function (context) {
          context.list.push(21);
          return fsm.on(context.getName(), this.gotName);
        },
        gotName: function (context, name) {
          context.list.push(22);
          context.username = name;
          return fsm
            .on(context.getPassword(), this.gotPassword)
            .onExit(function () {
              context.list.push(23)
            });
        },
        gotPassword: function (context, key) {
          context.list.push(24);
          context.key = key;
          return userAuth.authorised;
        }
      },
      authorised: function (context) {
        context.list.push(3);
        return fsm.on(context.actions.logout, userAuth.unauthorised);
      }
    });

    //plot a path through the state machine, starting once the unauthorised state is entered
    //NOTE: the differences between onEnter and onceActive are
    //1. onEnter is triggered on the transition, onceActive is after the transition has taken place
    //2. because of this if the state has already been entered onEnter will not trigger, however onceActive WILL
    //    trigger if the state is already active - so it avoids race conditions.
    return Promise.race([
      //catch any errors (the state machine should not exit, it will only do so if it hits an error)
      userAuth(context),
      //step through the state machine, triggering the required events as we go
      userAuth.unauthorised.onceActive(context)
        .then(function () {
          context.actions.login();
          return userAuth.login.getName.onceActive(context);
        })
        .then(function () {
          userAuth.getState(context).should.equal('login.getName');
          context.actions.setname('fred');
          return userAuth.login.gotName.onceActive(context);
        })
        .then(function () {
          userAuth.getState(context).should.equal('login.gotName');
          context.actions.cancel();
          return userAuth.unauthorised.onceActive(context);
        })
        .then(function () {
          context.actions.login();
          return userAuth.login.gotName.onceActive(context);
        })
        .then(function () {
          context.actions.password('abc');
          return userAuth.authorised.onceActive(context);
        })
        .then(function () {
          context.list.should.deep.equal([0, 1, 2, 21, 22, 23, 29, 1, 2, 22, 23, 24, 29, 3]);
        })
    ]);
  });
  describe('a reusable state machine with abstract states', function () {
    this.timeout(0);
    var context, submachine, machine;
    before(function () {
      context = {
        sub: {
          actions: action.actions(['one', 'two'])
        }
      };
      submachine = fsm({
        get _start() {
          return this.state;
        },
        state: function (context) {
          return fsm
            .on(context.actions.one, this.first)
            .on(context.actions.two, this.second);
        },
        first: fsm.abstract(),
        second: fsm.abstract()
      });
      machine = fsm({
        get _start() {
          return this.state;
        },
        state: function (context) {
          return submachine.using(context.sub)
            .on(submachine.first, this.prime)
            .on(submachine.second, this.seconde);
        },
        prime: function () {
          return 1;
        },
        seconde: function () {
          return 2;
        }
      });
    });
    it('transitions to external state prime on internal transition to first', function () {
      var prom = machine(context);
      context.sub.actions.one();
      return prom.should.eventually.equal(1);
    });
    it('transitions to external state seconde on internal transition to second', function () {
      var prom = machine(context);
      context.sub.actions.two();
      return prom.should.eventually.equal(2);
    });
  });
});
