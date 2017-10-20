/**
 * Converts any plain js object
 * into a valid vuex store
 * with state, getters, mutations and acitons.
 * 
 * @export objectToStore
 * @param {object} plainObject - Object to convert 
 * @param {string} [namespace = undefined] - Optional object namespace
 * @returns valid vuex store object for passing into a Vuex constructor.
 */
export function objectToStore(obj, namespace = undefined) {

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

  const objGetters = {}, objBoth = {};
  Object.entries(Object.getOwnPropertyDescriptors(obj))
    .forEach(entry => {
      !!entry[1].get && (objGetters[entry[0]] = entry[1]);
      (!!entry[1].get || !!entry[1].set) && (objBoth[entry[0]] = entry[1]);
    });

  function filterObject(filter) {
    let result = {};

    for (let key in obj) {
      if (filter(key)) switch (filter) {
        case filters.getter:
          const getter = Object.getOwnPropertyDescriptor(obj, key).get;
          result[key] = (state) => getter.call(Object.defineProperties(state, objGetters));
          break;

        case filters.mutation:
          const setter = Object.getOwnPropertyDescriptor(obj, key).set;
          result[key] = (state, payload) => setter.call(Object.defineProperties(state, objBoth), payload);
          break;
          
        case filters.action:
          const args = getArgs(obj[key]);
          result[key] = async function(context, payload) {
            const thisArg = (({state, getters, ...other}) => (Object.assign(Object.defineProperties(state, objBoth), other)))(context);
            
            const result = await obj[key].apply(thisArg, isObject(payload) ? args.map(value => payload[value]) : [payload]);

            context.state.dispatch = undefined;
            context.state.commit = undefined;
            context.state.rootState = undefined;
            context.state.rootGetters = undefined;

            return result;
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
    namespaced: !!namespace,
    state: filterObject(filters.state),
    getters: filterObject(filters.getter),
    mutations: filterObject(filters.mutation),
    actions: filterObject(filters.action)
  }
}

function isObject(obj) {
  return !!obj && obj.toString() === '[object Object]';
}

function getArgs(func) {
  const comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  const args = /([^\s,]+)/g;
  let fnStr = func.toString().replace(comments, '');
  return fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(args) || [];
}
