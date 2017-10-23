/** (c) Raiondesu
 * @license MIT
 */
/**
 * Converts any plain js object
 * into a valid vuex store
 * with state, getters, mutations and acitons.
 *
 * @export objectToStore
 * @param {object} plain - Object to convert
 * @param {boolean} [namespaced = false] - Whether to namespace the object
 * @returns valid vuex store object for passing into a Vuex constructor.
 */
exports.objectToStore = function(plain, namespaced) {
  function filterBy(wrap) {
    var result = {};
    for (let key in plain)
      if (valid(plain, key))
        wrap(result, plain, key);
    return result;
  }

  return {
    namespaced: !!namespaced,
    state: filterBy(state),
    getters: filterBy(getter),
    mutations: filterBy(mutation),
    actions: filterBy(action)
  };
}

function state(obj, donor, key) {
  if (!desc(donor, key).get && !desc(donor, key).set && typeof donor[key] !== 'function')
    Object.defineProperty(obj, key, {
      configurable: false,
      enumerable: true,
      get: () => donor[key],
      set: value => donor[key] = value
    });
}
  
function getter(obj, donor, key) {
  if (desc(donor, key).get && !desc(donor, key).set && typeof donor[key] !== 'function')
    obj[key] = () => donor[key];
}

function mutation(obj, donor, key) {
  if (!desc(donor, key).get && desc(donor, key).set && typeof donor[key] !== 'function')
    obj[key] = (state, payload) => donor[key] = payload;
}

function action(obj, donor, key) {
  if (typeof donor[key] === 'function') {
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
