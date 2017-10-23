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
  function filterBy(wrap) {
    var result = {};
    for (let key in plain)
      wrap(result, plain, key);
    return result;
  }
  
  return {
    namespaced,
    state: filterBy(state),
    getters: filterBy(getter),
    mutations: filterBy(mutation),
    actions: filterBy(action)
  };
}

let desc = Object.getOwnPropertyDescriptor;

function state(obj, donor, key) {
  if (!desc(donor, key).get && !desc(donor, key).set)
    Object.defineProperty(obj, key, {
      configurable: false,
      enumerable: true,
      get: () => donor[key],
      set: value => donor[key] = value
    });
}
  
function getter(obj, donor, key) {
  if (desc(donor, key).get && !desc(donor, key).set)
    obj[key] = () => donor[key];
}

function mutation(obj, donor, key) {
  if (!desc(donor, key).get && desc(donor, key).set)
    obj[key] = (state, payload) => donor[key] = payload;
}

function action(obj, donor, key) {
  if (donor[key] instanceof Function) {
    // Regex to filter out comments:
    const commentsRegex = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    // Regex to filter args:
    const argsRegex = /([^\s,]+)/g;

    // Exctract arguments array from a function:
    let fnStr = donor[key].toString().replace(commentsRegex, '');
    let args = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(argsRegex) || [];

    obj[key] = (context, payload) => {
      if (!donor.commit) {
        donor.commit = context.commit;
        donor.dispatch = context.dispatch;
        donor.rootState = context.rootState;
        donor.rootGetters = context.rootGetters;
      }
      
      return donor[key].apply(
        donor,
        payload === Object(payload) && args.length > 1 ?
          args.map(arg => payload[arg]) :
          [payload]
      );
    }
  }
}
