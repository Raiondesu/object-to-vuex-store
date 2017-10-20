function isPrimitive(test) {
    return (test !== Object(test));
};

function isObject(obj) {
	return !!obj && Object.prototype.toString.call(obj) === '[object Object]';
};

describe('objectToStore', function() {
	var objectToStore, Vue, Vuex;
	beforeEach(function() {
		objectToStore = require('../cjs').objectToStore
		Vue = require('vue')
		Vuex = require('Vuex')
		Vue.use(Vuex)
	})

	it('translates state', function() {
		var object, state;
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

		state = objectToStore(object).state;

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
		var object, store;
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


		store = new Vue({store: new Vuex.Store(objectToStore(object))}).$store;

		var haha = store.getters.haha;
		var nope = store.getters.nope;
		var nine = store.getters.nine;
		var thirtythree = store.getters.thirtythree;

		console.assert(haha === object.haha, 'haha is not haha, haha is %s', haha);
		console.assert(nope === object.nope, 'nope is not nope, nope is %s', nope);
		console.assert(nine === object.nine, 'nine is not 9, nine is %s', nine);
		console.assert(thirtythree === object.thirtythree, 'thirtythree is not 33, thirtythree is %s', thirtythree);
	})

	it('translates mutations', function() {
		var object, store;
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

	it('translates actions', function() {
		function timeout(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		var object, store;
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

			addInto33(/* the first number to add */number1, /* the secind number to add */number2) {
				this.thirtythree = number1 + number2;
				return this.someObj.value;
			}
		};


		store = new Vue({store: new Vuex.Store(objectToStore(object))}).$store;

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

	it('supports module nesting', function() {
		function timeout(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		var object, store;
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

			addInto33(/* the first number to add */number1, /* the secind number to add */number2) {
				this.thirtythree = number1 + number2;
				return this.someObj.value;
			}
		};


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
		function timeout(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		var object, store;
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

			addInto33(/* the first number to add */number1, /* the secind number to add */number2) {
				this.commit('thirtythree', number1 + number2);
				return this.someObj.value;
			}
		};


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
})