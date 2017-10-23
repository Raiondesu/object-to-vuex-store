# object-to-vuex-store
## [![Travis branch](https://img.shields.io/travis/Raiondesu/object-to-vuex-store/master.svg?style=flat-square)](https://travis-ci.org/Raiondesu/object-to-vuex-store) ![size](https://badges.herokuapp.com/size/npm/object-to-vuex-store@latest/dist/index.js?style=flat-square) ![size](https://badges.herokuapp.com/size/npm/object-to-vuex-store@latest/dist/index.js?style=flat-square&gzip=true) [![David](https://img.shields.io/david/raiondesu/object-to-vuex-store.svg?style=flat-square)]() [![David](https://img.shields.io/david/dev/raiondesu/object-to-vuex-store.svg?style=flat-square)]() [![npm](https://img.shields.io/npm/dt/object-to-vuex-store.svg?style=flat-square)](http://npmjs.com/package/object-to-vuex-store)

This library provides a seamless translation from a plain JS-object into a vuex-valid store/module.
It contains only one function: `objectToStore` that does all the job.

## Parameters

NAME        |  TYPE    |  DEFAULT  | DESCRIPTION
----------- | ------   | --------- | -----------
plainObject | object   |     -     | Object to convert
namespace   | boolean  |   false   | Whether to namespace the object

## Installation & Usage

```bash
npm install --save object-to-vuex-store
```
```js
// store.js

import Vue from 'vue'
import Vuex from 'vuex'
import { objectToStore } from 'object-to-vuex-store'

Vue.use(Vuex)

export default new Vuex({
  ...objectToStore({
    field: '',
    get Field() {
      return this.field;
    },
    set setField(value) {
      this.field = value;
    },
    setFieldAsync(value, time) {
      setTimeout(() => {
        this.setField = value;
      }, time);
    }
  }),

  modules: {
    // Yep, you can use it in here too!
    someModule: objectToStore(someOtherPlainObject, true)
  }
})
```
```js
// some component.vue
...
this.$store.dispatch('setFieldAsync', { value: 'foo', time: 1000 }).then(() => {
  console.log(this.$store.getters.Field) // logs "foo"
});
...

```

### Conversion schema (regarding the above example):
Input object field (plain) | Output object field (store)
---------------------------|---------------
field: ''                  | state.field  [get/set]  
get Field()                | getters.Field  
set setField(value)        | mutations.setField(state, value)  
setFieldAsync(value, time) | actions.setFieldAsync(context, { value, time })  

-------------------------
-------------------------

## Description & under-the-hood principles

See [Example](#deep-example) for more practical explanation on how things really work under the hood.

All this function does is it creates a 'wrapper' object around yours, capturing it in memory.  
Every property on your object is mapped via a getter/setter pair.  
Every getter is mapped to a vuex getter function.  
Every setter - to a mutation function.  
And every plain function - to a vuex action function.  
Due to this "referencing" this lib adds little to no difference in both memory and performance compared to plain vuex,
while maintaining consistency and simplicity of plain JS objects.  
This way Vuex is tricked to think that it has just its conventional object to work with,
whereas it just calls functions that internally reference your object.

All Vuex caveats are also removed as a bonus that comes with this type of under-the-hood behaviour - you can use all your properties, getters, setters and methods wherever you want in your object.  
More than that - you can also grasp all the benefits of Vuex's `rootState` and `rootGetters` (also `commit` and `dispatch`) in your modules, since these are added dynamically to the context of your functions upon invocation!

### Deep-Example

```js
const somePlainObject = {
  // Each field that is a primitive, array or an object
  // converts to state.store
  array: [ 'foo', 'bar' ],
  field: '',

  // Each getter GETTER_NAME converts into a vuex getter
  get Foo() {
    return this.array[0];
  },

  // Getter as "computed property" with additional argument
  get ArrayElement() {
    return index => this.array[index];
  }

  // Each setter SETTER_NAME converts into a vuex mutation
  // and is accessible via store.commit('SETTER_NAME', payload)
  set AddToArray(value) {
    this.array.push(value);
  },

  // Caveat: getters and setters cannot have equal names!
  // this one would override the 'Foo' getter!
  // set Foo(value) {
  //   return this.array[0] = value;
  // },

  // Each method (async included) is converted into a dispatchable vuex action.
  async AddToArrayAsync(value, time) {
    setTimeout(() => {
      // You can do this:
      this.AddToArray = value;
      // vuex will not register this as a commit,
      // while still updating the storage, whatsoever.

      // but you might as well do:
      this.commit('AddToArray', value);
      // since there is no practical difference.
    }, time);

    // Also you can use rootGetters, rootState, commit and dispatch,
    // as if they were on your object:
    console.log(this.rootState);    // logs all root properties
    console.log(this.rootGetters);  // logs all root getters
    console.log(this.commit);       // logs function boundCommit(type, payload) {}
    console.log(this.dispatch);     // logs function boundDispatch(type, payload) {}
  },

  // Vuex's "natural" object arguments work too
  async AwaitAddToArray({ value, time }) {
    // Yes, it works.
    await this.dispatch('AddToArrayAsync', { value, time });

    // as well as this:
    await this.AddToArrayAsync(value, time);
  }
}

```

```js
const storeObject = objectToStore(somePlainObject, /*namespaced:*/ false);

// storeObject is something like this:
{
  namespaced: false,

  // All getters and setters are enumerable,
  // i.e. treated by JS and Vuex as plain simple variables.
  state: {
    get field() { return somePlainObject.field; },
    set field(value) { return somePlainObject.field = value; },

    get array() { return somePlainObject.array; },
    set array(value) { return somePlainObject.array = value; },
  },

  getters: {
    Foo: (state, getters) => somePlainObject.Foo,
    ArrayElement: (state, getters) => somePlainObject.ArrayElement;
    // which returnes a lambda for `ArrayElement(index)` syntax:
    // this.$store.getters.ArrayElement(1), for example, returns "bar"
  },

  mutations: {
    AddToArray(state, value) {
      // It's not literally like this but the principle is the same,
      // with difference being that the setter is binded BEFORE invocation
      // which helps to maintain the same anout of real computational operations.
      somePlainObject.AddToArray.setter.call(somePlainObject, value);
    }
  },

  // Actions are as simple as that:
  actions: {
    async AddToArrayAsync(context, { value, time }) {
      somePlainObject.AddToArrayAsync(value, time);
    },
    async AwaitAddToArray(context, payload) {
      somePlainObject.AwaitAddToArray(payload);
    }
  }
}
```

Notice how all the fields and methods reference the original object.
This, though, doesn't mean that it should be defined separately.

Notation like
`const store = objectToStore({ /* some fields and methods here */ })`
will work exactly the same.

-----

© 2017 Alexey "Raiondesu" Iskhakov
