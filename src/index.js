/** (c) Raiondesu
 * @license MIT
 */
/**
 * Converts any plain js object
 * into a valid vuex store object
 * with state, getters, mutations and acitons.
 *
 * @export objectToStore
 * @param {object} plain - Object to convert
 * @param {boolean} [namespaced = false] - Whether to namespace the object
 * @returns valid vuex store object for passing into a Vuex constructor.
 */
exports.objectToStore = function(plain, namespaced) {
  var state = {},
    getters = {},
    mutations = {},
    actions = {};
  
  var descriptor = Object.getOwnPropertyDescriptor;

  for (var prop in plain) + function(key) {
    if (plain[key] instanceof Function) {
      actions[key] = function(context, payload) { return plain[key](payload); }
    }
    
    else if (descriptor(plain, key).set) {
      mutations[key] = function(state, payload) { return plain[key] = payload; }
    }
    
    else if (descriptor(plain, key).get) {
      getters[key] = function() { return plain[key]; }
    }
    
    else {
      Object.defineProperty(state, key, {
        configurable: false,
        enumerable: true,
        get: function() { return plain[key]; },
        set: function(value) { return plain[key] = value; }
      });
    };
  }(prop);
  
  return {
    namespaced: namespaced,
    state: state,
    getters: getters,
    mutations: mutations,
    actions: actions
  };
}
