

/**
 * Converts any plain js object
 * into a valid vuex store
 * with state, getters, mutations, acitons
 * and modules.
 * 
 * @export objectToStore
 * @param {object} plainObject - Object to convert 
 * @param {boolean} [namespaced = false] - Whether or not to namespace the object
 * @param {any} [modules = undefined] - Optional nested modules
 * @returns valid vuex store object for passing into a Vuex constructor.
 */
export function objectToStore(obj, namespaced = false, modules = undefined) {
  // Process modules first. Because it's easy and time-consuming.
  for (let key in modules)
    modules[key] = objectToStore(modules[key]);

  const filters = (function(_obj) {
    const __desc = prop => Object.getOwnPropertyDescriptor(_obj, prop);
    const __isValid    = prop => !!_obj && !!prop && !!__desc(prop);
    const __isFunction = prop => typeof _obj[prop] === 'function';

    return {
      state: (prop) => __isValid(prop) && !__desc(prop).get && !__desc(prop).set && !__isFunction(prop),
      getter: (prop) => __isValid(prop) && __desc(prop).get && !__desc(prop).set && !__isFunction(prop),
      mutation: (prop) => __isValid(prop) && !__desc(prop).get && __desc(prop).set && !__isFunction(prop),
      action: (prop) => __isValid(prop) && __isFunction(prop)
    }
  }(obj));

  /// (c) by davidwalsh.name
  const getArgs = (func) => func.toString()
    .match(/function\s.*?\(([^)]*)\)/)[1].split(',') // Get args
    .map(arg => arg.replace(/\/\*.*?\*\//, '').trim()) // Filter comments
    .filter(arg => arg); // Filter undefined-s

  function filterObject(filter) {
    let result = {};

    for (let key in obj) {
      if (filter(key)) switch (filter) {
        case filters.getter:
          result[key] = (state) => Object.getOwnPropertyDescriptor(obj, key).get.call(state);
          break;

        case filters.mutation:
          result[key] = (state, payload) => Object.getOwnPropertyDescriptor(obj, key).set.call(state, payload);
          break;

        case filters.action:
          result[key] = (context, payload) => {
            let args = undefined;

            if (Object.prototype.toString.call(payload) === '[object Object]')
              args = getArgs(obj[key]).map(value => payload[value]);

            let thisArg = (({state, getters, ...other}) => ({ ...state, ...getters, ...other }))(context);

            return obj[key].apply(thisArg, args || [payload]);
          }
          break;

        case filters.state: default:
          result[key] = obj[key];
          break;
      }
    }

    return result;
  }

  return {
    namespaced,
    state: filterObject(filters.state),
    getters: filterObject(filters.getter),
    mutations: filterObject(filters.mutation),
    actions: filterObject(filters.action),
    modules: modules
  }
}
