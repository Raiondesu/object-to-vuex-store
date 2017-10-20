# object-to-vuex-store

This is a small (<1KB gzipped) library that provides a seamless conversion from a plain JS-object into a vuex-valid store/module.
It contains only one function: `objectToStore` that does all the job.

## Parameters

NAME        |  TYPE   |  DEFAULT  | DESCRIPTION
----------- | ------  | --------- | -----------
plainObject | object  |     -     | Object to convert
namespace   | string  | undefined | Optional object namespace

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
    // Caveat: getters can only use state fields and other getters (not setters nor methods),
    // as prescribed by vuex itself.
    get authorized () {
      return this.tokens && this.tokens.access && this.tokens.access.length > 0;
    },

    // Each setter SETTER_NAME converts into a vuex mutation
    // and is accessible via store.commit('SETTER_NAME', payload)
    // Caveat: setters can only see getters and fields, as prescribed by vuex itself.
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


    // Each method (async included) is sconverted into a dispatchable vuex action
    // Caveat: methods cannot use other methods, as prescribed by vuex.
    logout() {
      window.localStorage.clear();
      location.reload();
    },

    async signup(password) {
      let this = self;
      return await json.post('/signup', { username: self.email, phoneNumber: self.phone, firstName: self.name, password });
    },

    async signin(password) {
      if (this.authorized)
          return true;

      const url = '/oauth/token';

      try {
        let response = await http.post(url, encodeURI(`grant_type=password&username=${this.username}&password=${password}`));
        let data = response.data;
        this.commit('setTokens', { access: data['access_token'], refresh: data['refresh_token'] });
        return true;
      }
      catch (e) {
        console.log(e);
        return false;
      }
    },
  },
  'user'
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
    'authorized'(state) {
      return state.tokens && state.tokens.access && state.tokens.access.length > 0;
    }
  },
  mutations: {
    'setUsername'(state, value) {
      state.username = value;
    },

    'setTokens'(state, tokens) {
      state.tokens = tokens;
    },
  },
  actions: {
    'logout'() {
      window.localStorage.clear();
      location.reload();
    },

    async 'signup'(context, password) {
      let self = context.state;
      return await json.post('/signup', { username: self.email, phoneNumber: self.phone, firstName: self.name, password });
    },

    async 'signin'(context, password) {
      if (context.getters.authorized)
        return true;

      const url = '/oauth/token';

      try {
        let response = await http.post(url, encodeURI(`grant_type=password&username=${context.state.username}&password=${password}`));
        let data = response.data;
        this.commit('setTokens', { access: data['access_token'], refresh: data['refresh_token'] });
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


### ⚠️Warning⚠️
To provide the described syntactic sugar this library invokes `Object.assign` and `Object.defineProperties` on each store method call (getter, mutation or action).
If you extensively use long loops with getters, mutations or actions your application logic can suffer due to this limitation.
If you are VERY concerned about performance - it's recommended either not to use this library or to move your loop logic inside the methods:

**BAD**:
```js
// some .vue:
for (let i = 0; i < 1000; i++)
  this.$store.commit('increment');


// store.js
set increment() {
  this.counter++;
}
```

**GOOD**:
```js
//some .vue:
this.$store.commit('incrementNTimes', 1000);

// store.js
set incrementNTimes(value) {
  for (let i = 0; i < value; i++) {
    this.counter++;
  }
}
```