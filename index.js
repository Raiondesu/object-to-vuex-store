/**
 * Converts any plain js object
 * into a valid vuex store
 * with state, getters, mutations and acitons.
 *
 * @export objectToStore
 * @param {object} plainObject - Object to convert
 * @param {boolean} [namespaced = false] - Optional object namespace
 * @returns valid vuex store object for passing into a Vuex constructor.
 */
export function objectToStore(obj, namespaced = false) {
  const filters = createFilters(obj);

  function filterObject(filter) {
    var result = {};

    for (let key in obj) {
      if (filter(key)) switch (filter) {
        case filters.getter:
          result[key] = () => obj[key];
          break;

        case filters.mutation:
          result[key] = createMutation(obj, key);
          break;

        case filters.action:
          result[key] = createAction(obj, key);
          break;
          
        case filters.state: default:
          createProp(result, obj, key);
          break;
      }
    }

    return result;
  }

  return {
    namespaced: namespaced,
    state: filterObject(filters.state),
    getters: filterObject(filters.getter),
    mutations: filterObject(filters.mutation),
    actions: filterObject(filters.action)
  }
}

function createFilters(_obj) {
  const __desc = prop => Object.getOwnPropertyDescriptor(_obj, prop);
  const __isValid    = prop => !!_obj && !!prop && !!__desc(prop);
  const __isFunction = prop => typeof _obj[prop] === 'function';

  return {
    state: (prop) => __isValid(prop) && !__desc(prop).get && !__desc(prop).set && !__isFunction(prop),
    getter: (prop) => __isValid(prop) && __desc(prop).get && !__desc(prop).set && !__isFunction(prop),
    mutation: (prop) => __isValid(prop) && !__desc(prop).get && __desc(prop).set && !__isFunction(prop),
    action: (prop) => __isValid(prop) && __isFunction(prop)
  }
}

function createProp(obj, donor, key) {
  Object.defineProperty(obj, key, {
    configurable: false,
    enumerable: true,
    get: () => donor[key],
    set: value => donor[key] = value
  });
}

function createMutation(obj, key) {
  const setter = Object.getOwnPropertyDescriptor(obj, key).set;  
  return (state, payload) => setter.call(obj, payload);
}

function createAction(obj, key) {
  const args = getArgs(obj[key]);
  return function (context, payload) {
    if (!obj['commit'] || !obj['dispatch'] || !obj['rootState'] || !obj['rootGetters']) {
      obj['commit'] = context.commit;
      obj['dispatch'] = context.dispatch;
      obj['rootState'] = context.rootState;
      obj['rootGetters'] = context.rootGetters;
    }

    return obj[key].apply(obj, isObject(payload) ? args.map(value => payload[value]) : [payload]);
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
