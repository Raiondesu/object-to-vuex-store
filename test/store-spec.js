function isPrimitive(test) {
    return (test !== Object(test));
};

function isObject(obj) {
	return !!obj && Object.prototype.toString.call(obj) === '[object Object]';
};

describe('objectToStore', function() {
	var objectToStore, Vue, Vuex;
	var object, store;
	
	beforeEach(function() {
		objectToStore = require('../cjs').objectToStore
		Vue = require('vue')
		Vuex = require('vuex')
		Vue.use(Vuex)
	})

	it('translates state', function() {
		object = {
			array: ['haha', 'ahah'],
			someObj: {
				value: 42,
				nope: 'nope'
			},
			primitiveString: 'haha',
			primitiveNumber: 9,
			primitiveBoolean: true,
			primitiveNull: null,
			primitiveUndefined: undefined
		};

		var state = objectToStore(object).state;

		Object.keys(object).forEach(function(key) {
			if (isPrimitive(state[key])) {
				console.assert(object[key] === state[key], 'primitive %s does not match: %s', key, state[key]);
			}
			else if (Array.isArray(state[key])) {
				console.assert(Array.isArray(state[key]) && state[key] === object[key], 'arrays %s do not match: ', key, state[key]);
			}
			else if (isObject(state[key])) {
				console.assert(Object.is(object[key], state[key]), 'objects object[%s](%s) and state[%s](%s) do not match', key, object[key], key, state[key], key);
			}
			else if (typeof state[key] === 'funciton') {
				console.assert(false, 'state[%s] is a function!!!', key);
			}
			else {
				console.assert(false, 'state[%s] is some unknown shit! %s', key, state[key]);
			}
		})
	})

	it('translates getters', function() {
		object = {
			array: ['haha', 'ahah'],
			someObj: {
				value: 42,
				nope: 'nope'
			},
			primitiveString: 'haha',
			primitiveNumber: 9,
			get haha() {
				return this.array[0];
			},
			get nope() {
				return this.someObj.nope;
			},
			get nine() {
				return this.primitiveNumber
			},
			get thirtythree() {
				return this.someObj.value - this.nine;
			}
		};


		var getters = new Vue({store: new Vuex.Store(objectToStore(object))}).$store.getters;

		var haha = getters.haha;
		var nope = getters.nope;
		var nine = getters.nine;
		var thirtythree = getters.thirtythree;

		console.assert(haha === object.haha, 'haha is not haha, haha is %s', haha);
		console.assert(nope === object.nope, 'nope is not nope, nope is %s', nope);
		console.assert(nine === object.nine, 'nine is not 9, nine is %s', nine);
		console.assert(thirtythree === object.thirtythree, 'thirtythree is not 33, thirtythree is %s', thirtythree);
	})

	it('translates mutations', function() {
		object = {
			array: ['haha', 'ahah'],
			someObj: {
				value: 42,
				nope: 'nope'
			},
			primitiveString: 'haha',
			primitiveNumber: 9,
			get nine() {
				return this.primitiveNumber;
			},
			set haha(value) {
				return this.array[0] = value;
			},
			set nope(value) {
				this.someObj.nope += value;
			},
			set number(value) {
				this.primitiveNumber = value;
			},
			set thirtythree(value) {
				this.someObj.value = value - this.nine;
			}
		};


		store = new Vue({store: new Vuex.Store(objectToStore(object))}).$store;

		var hehe = 'hehe';
		console.assert(store.commit('haha', hehe) !== hehe, 'commit returned a value');

		store.commit('nope', 'nope');
		var nopenope = store.state.someObj.nope;
		console.assert(nopenope === 'nopenope', 'nopenope is not nopenope: ', nopenope);

		store.commit('number', 7);
		console.assert(store.state.primitiveNumber === 7, 'primitiveNumber is not 7, but ', store.state.primitiveNumber);

		store.commit('thirtythree', 6);
		console.assert(store.state.someObj.value === -1, 'thirtythree must be -1 instead of ', store.state.someObj.value);
	})

	beforeEach(function() {
		objectToStore = require('../cjs').objectToStore
		Vue = require('vue')
		Vuex = require('vuex')
		Vue.use(Vuex)

		function timeout(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
		
		object = {
			array: ['haha', 'ahah'],
			someObj: {
				value: 42,
				nope: 'nope'
			},
			primitiveString: 'haha',
			primitiveNumber: 9,
			get nine() {
				return this.primitiveNumber;
			},
			set number(value) {
				this.primitiveNumber = value;
			},
			set haha(value) {
				return this.array[0] = value;
			},
			set nope(value) {
				this.someObj.nope += value;
			},
			set thirtythree(value) {
				this.someObj.value = value - this.nine;
			},

			concatArray(arr) {
				this.array = this.array.concat(arr);
				return this.array;
			},

			async getPrimitiveString() {
				await timeout(1000);
				return this.primitiveString;
			},
			
			async addIntoNine(number) {
				// await timeout(1000);
				this.number = this.nine + number;
				return this.nine;
			},
			
			addInto33(/* the first number to add */number1, /* the second number to add */number2) {
				this.commit('thirtythree', number1 + number2);
				return this.someObj.value;
			}
		};
	})
	
	it('translates actions', function() {
		store = new Vue({store: new Vuex.Store(objectToStore(object))}).$store;

		var hehe = ['hehe'];
		store.dispatch('concatArray', hehe).then(function(result) {
			console.assert(result[2] === hehe[0], 'array is wrong: ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('getPrimitiveString').then(function (result) {
			console.assert(result === object.primitiveString, 'primitiveString is not returned correctly ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('addIntoNine', 90).then(function (result) {
			console.assert(result === 99, ':c math is wrong: ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('addInto33', {number1: 40, number2: 59}).then(function(result) {
			console.assert(result === 0, 'math is wrong again: ', result);
		}).catch(function(err) {console.assert(false, err)});
	})

	it('supports module nesting', function() {
		store = new Vue({store: new Vuex.Store({ modules: { object: objectToStore(object) } })}).$store;

		console.assert(isObject(store.state.object), 'there\'re no modules... ', store.state);

		var hehe = ['hehe'];
		store.dispatch('concatArray', hehe).then(function(result) {
			console.assert(result[2] === hehe[0], 'array is wrong: ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('getPrimitiveString').then(function (result) {
			console.assert(result === object.primitiveString, 'primitiveString is not returned correctly');
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('addIntoNine', 90).then(function (result) {
			console.assert(result === 99, ':c math is wrong: ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('addInto33', {number1: 40, number2: 59}).then(function(result) {
			console.assert(result === 0, 'math is wrong again: ', result);
		}).catch(function(err) {console.assert(false, err)});
	})

	it('applies namespacing', function() {
		store = new Vue({store: new Vuex.Store({ modules: { object: objectToStore(object, 'object') } })}).$store;

		console.assert(isObject(store.state.object), 'there\'re no modules... ', store.state);

		var hehe = ['hehe'];
		store.dispatch('object/concatArray', hehe).then(function(result) {
			console.assert(result[2] === hehe[0], 'array is wrong: ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('object/getPrimitiveString').then(function (result) {
			console.assert(result === object.primitiveString, 'primitiveString is not returned correctly');
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('object/addIntoNine', 90).then(function (result) {
			console.assert(result === 99, ':c math is wrong: ', result);
		}).catch(function(err) {console.assert(false, err)});

		store.dispatch('object/addInto33', {number1: 40, number2: 59}).then(function(result) {
			console.assert(result === 0, 'math is wrong again: ', result);
		}).catch(function(err) {console.assert(false, err)});
	})

	it('does not add garbage', function() {
		var _object = {
			username: '',
			email: '',
			phone: '',
			name: '',
		  
			tokens: {
			  access: '',
			  refresh: ''
			},
		  
			get authorized () {
			  return this.tokens && this.tokens.access && this.tokens.access.length > 0;
			},
		  
			set setUsername(value) {
			  this.username = value;
			  if (value[0] === '+')
				this.phone = value;
			  else
				this.email = value;
			},
		  
			set setTokens(tokens) {
			  this.tokens.access = tokens.access;
			  this.tokens.refresh = tokens.refresh;
			},
		  
			logout() {
			  window.localStorage.clear();
			  setTimeout(() => location.reload(), 200);
			},
		  
			async signup(email, phoneNumber, firstName, password) {
			  // TODO
			  return await json.post('/signup', { username: email, phoneNumber, firstName, password });
			},
		  
			async signin(password) {
			  const url = '/oauth/token';
			  const config = {
				headers: {
				  'Content-Type': 'application/x-www-form-urlencoded',
				  Authorization: 'Basic a2F6YW5leHByZXNzOnNlY3JldEtleQ==',
				  Accept: 'application/json'
				}
			  };
		  
			  try {
				let data = { access_token: 'asdasd', refresh_token: 'dsadsa' };
				this.commit('setTokens', { access: data['access_token'], refresh: data['refresh_token'] });
				return true;
			  }
			  catch (e) {
				console.log(e);
				return false;
			  }
			}
		}

		function censor(censor) {
			var i = 0;
		  
			return function(key, value) {
				if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
					return '[Circular]'; 
			
				if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
					return '[Unknown]';
			
				++i; // so we know we aren't using the original object anymore
			
				return value;  
			}
		}

		var _str = new Vue({store: new Vuex.Store(objectToStore(_object))}).$store;

		_str.dispatch('signin', 'asdasd').then(result => {
			console.assert(JSON.stringify(_str.state, censor(_str.state)).indexOf('[Circular]') === -1, 'JSON is again recursive for ', _str.state);
		})
	})
})