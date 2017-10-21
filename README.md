# object-to-vuex-store

This is a small (<1KB gzipped) library that provides a seamless conversion from a plain JS-object into a vuex-valid store/module.
It contains only one function: `objectToStore` that does all the job.

## Parameters

NAME        |  TYPE    |  DEFAULT  | DESCRIPTION
----------- | ------   | --------- | -----------
plainObject | object   |     -     | Object to convert
namespace   | boolean  |   false   | Whether to namespace the object

## Description & Under the hood principles

All this function does is it creates a 'wrapper' object around yours
with getters and setters pointing to its properties
and functions for getters, mutations and actions
that invoke setters and other functions from your original object.

This way Vuex is tricked to think that it has its conventional object to work with, whereas it's just a warpper around the original plain JS object.

All Vuex caveats are also removed as a bonus that comes with this type of under-the-hood behaviour - you can use all your properties, getters, setters and methods wherever you want in your object. And, plus, you can also grasp all the benefits of Vuex's `rootState` and `rootGetters` (also `commit` and `dispatch`) in your modules, since these are added dynamically to the context of your functions upon invocation!

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
  ...objectToStore(somePlainObject)
})

//... See Example for more explanation.
const somePlainObject = {
  field: '',
  get Field() {
    return this.field;
  },
  set setField(value) {
    this.field = value;
  },
  async setFieldAsync(value) {
    setTimeout((_this, _value) => {
      _this.field = _value;
    }, 1000, this, value);
  }
}

```

## Example:

```js
const user = objectToStore({
    // Each field that is a primitive, array or an object
    // converts to state.store

    username: '',
    email: '',
    phone: '',
    name: '',

    tokens: {
      access: '',
      refresh: ''
    },
    //

    // Each getter GETTER_NAME converts into a vuex getter
    get authorized () {
      return this.tokens && this.tokens.access && this.tokens.access.length > 0;
    },

    // Each setter SETTER_NAME converts into a vuex mutation
    // and is accessible via store.commit('SETTER_NAME', payload)
    set setUsername(value) {
      this.username = value;
    },

    set setTokens(tokens) {
      this.tokens = tokens;
    },
    
    // Caveat: getters and setters cannot have equal names!
    // this one would override the 'authorized' getter!
    // set authorized (tokens) {
    //   this.setTokens = tokens;
    // },
    //


    // Each method (async included) is converted into a dispatchable vuex action.
    
    logout() {
      window.localStorage.clear();
      location.reload();
      // Also you ca use rootGetters and rootState as if they were on your object:
      console.log(this.rootState); // logs all root properties
      console.log(this.rootGetters); // logs all root getters
    },

    async signup(password) {
      let self = this;
      return await json.post('/signup', { username: self.email, phoneNumber: self.phone, firstName: self.name, password });
    },

    async signin(password) {
      if (this.authorized)
          return true;

      const url = '/oauth/token';

      try {
        let response = await http.post(url, encodeURI(`grant_type=password&username=${this.username}&password=${password}`));
        let data = response.data;
        this.setTokens = { access: data['access_token'], refresh: data['refresh_token'] };
        // Might as well do:
        this.commit('setTokens', { access: data['access_token'], refresh: data['refresh_token'] });        
        return true;
      }
      catch (e) {
        console.log(e);
        return false;
      }
    },
  },
  // namespaced:
  true
)
```

translates to

```js
// console.log(user):

{
  namespaced: true,
  state: {
    username: '',
    email: '',
    phone: '',
    name: '',

    tokens: {
      access: '',
      refresh: ''
    }
  },
  getters: {
    'user/authorized'(state) {
      return state.tokens && state.tokens.access && state.tokens.access.length > 0;
    }
  },
  mutations: {
    'user/setUsername'(state, value) {
      state.username = value;
    },

    'user/setTokens'(state, tokens) {
      state.tokens = tokens;
    },
  },
  actions: {
    'user/logout'() {
      window.localStorage.clear();
      location.reload();
    },

    async 'user/signup'(context, password) {
      let self = context.state;
      return await json.post('/signup', { username: self.email, phoneNumber: self.phone, firstName: self.name, password });
    },

    async 'user/signin'(context, password) {
      if (context.getters.authorized)
        return true;

      const url = '/oauth/token';

      try {
        let response = await http.post(url, encodeURI(`grant_type=password&username=${context.state.username}&password=${password}`));
        let data = response.data;
        context.commit('user/setTokens', { access: data['access_token'], refresh: data['refresh_token'] });
        return true;
      }
      catch (e) {
        console.log(e);
        return false;
      }
    }
  }
}
```

with each field being mapped into state, each get function into a getter, set function into a mutation and all other funcitons into actions.