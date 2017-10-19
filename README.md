# object-to-vuex-store

This is a small (<1KB gzipped) library that provides a seamless conversion from a plain JS-object into a vuex-valid store/module.

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
  set Field(value) {
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
const user = {
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
  //


  // Each method (async included) converts into a dispatchable vuex action
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

  // Special key that contains child modules
  modules: {
    // You can put whatever objects you want here - they will be parsed into vuex modules recursively.
  }
}
```

translates to

```js
{
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
    authorized (state) {
      return state.tokens && state.tokens.access && state.tokens.access.length > 0;
    }
  },
  mutations: {
    setUsername(state, value) {
      state.username = value;
    },

    setTokens(state, tokens) {
      state.tokens = tokens;
    },
  },
  actions: {
    logout() {
      window.localStorage.clear();
      location.reload();
    },

    async signup(context, password) {
      let self = context.state;
      return await json.post('/signup', { username: self.email, phoneNumber: self.phone, firstName: self.name, password });
    },

    async signin(context, password) {
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
  },

  modules: {
    // Whatever you've put here in the original object.
  }
}
```

with each field being mapped into state, each get function into a getter, set function into a mutation and all other funciton into actions.

