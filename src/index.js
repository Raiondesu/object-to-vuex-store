/** (c) Raiondesu
 * @license MIT
 * 
 * Converts any plain js object
 * into a valid vuex store
 * with state, getters, mutations and acitons.
 *
 * @export objectToStore
 * @param {object} plain - Object to convert
 * @param {boolean} [namespaced = false] - Optional object namespace
 * @returns valid vuex store object for passing into a Vuex constructor.
 */
exports.objectToStore = function(plain, namespaced) {
  function filterObject(filter, define) {
    var result = {};
    for (let key in plain)
      if (valid(plain, key))
        filter(plain, key) && define(result, plain, key);
    return result;
  }

  return {
    namespaced: !!namespaced,
    state: filterObject(filters.state, defineProperty),
    getters: filterObject(filters.getter, defineGetter),
    mutations: filterObject(filters.mutation, defineMutation),
    actions: filterObject(filters.action, defineAction)
  };
}

const filters = {
  state: (obj, prop) => !desc(obj, prop).get && !desc(obj, prop).set && typeof obj[prop] !== 'function',
  getter: (obj, prop) => desc(obj, prop).get && !desc(obj, prop).set && typeof obj[prop] !== 'function',
  mutation: (obj, prop) => !desc(obj, prop).get && desc(obj, prop).set && typeof obj[prop] !== 'function',
  action: (obj, prop) => typeof obj[prop] === 'function'
};

function defineProperty(obj, donor, key) {
  Object.defineProperty(obj, key, {
    configurable: false,
    enumerable: true,
    get: () => donor[key],
    set: value => donor[key] = value
  });
}
  
function defineGetter(obj, donor, key) {
  return obj[key] = () => donor[key];
}

function defineMutation(obj, donor, key) {
  return obj[key] = (state, payload) => donor[key] = payload;
}

function defineAction(obj, donor, key) {
  let args = getArgs(donor[key]);
  obj[key] = (context, payload) => {
    if (!donor.commit) {
      donor.commit = context.commit;
      donor.dispatch = context.dispatch;
      donor.rootState = context.rootState;
      donor.rootGetters = context.rootGetters;
    }
    
    return donor[key].apply(
      donor,
      payload && payload.toString() === '[object Object]' && args.length > 1 ?
        args.map(arg => payload[arg]) :
        [payload]
    );
  }
}

function getArgs(func) {
  const comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  const args = /([^\s,]+)/g;
  let fnStr = func.toString().replace(comments, '');
  return fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(args) || [];
}

function valid(obj, prop) {
  return obj && desc(obj, prop);
}

function desc(obj, prop) {
  return Object.getOwnPropertyDescriptor(obj, prop);
}
