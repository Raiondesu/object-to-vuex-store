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
  return {
    namespaced: namespaced,
    state: filterObject(filters.state, obj),
    getters: filterObject(filters.getter, obj),
    mutations: filterObject(filters.mutation, obj),
    actions: filterObject(filters.action, obj)
  }
}

const filters = (function createFilters() {
  const __desc = (_obj, prop) => Object.getOwnPropertyDescriptor(_obj, prop);
  const __isValid    = (_obj, prop) => !!_obj && !!prop && !!__desc(_obj, prop);
  const __isFunction = (_obj, prop) => typeof _obj[prop] === 'function';

  return {
    state: (_obj, prop) => __isValid(_obj, prop) && !__desc(_obj, prop).get && !__desc(_obj, prop).set && !__isFunction(_obj, prop),
    getter: (_obj, prop) => __isValid(_obj, prop) && __desc(_obj, prop).get && !__desc(_obj, prop).set && !__isFunction(_obj, prop),
    mutation: (_obj, prop) => __isValid(_obj, prop) && !__desc(_obj, prop).get && __desc(_obj, prop).set && !__isFunction(_obj, prop),
    action: (_obj, prop) => __isValid(_obj, prop) && __isFunction(_obj, prop)
  }
}());

function filterObject(filter, _obj) {
  var result = {};
  for (let key in _obj) {
    if (filter(_obj, key)) switch (filter) {
      case filters.getter:
        result[key] = () => _obj[key];
        break;

      case filters.mutation:
        result[key] = createMutation(_obj, key);
        break;

      case filters.action:
        result[key] = createAction(_obj, key);
        break;
        
      case filters.state: default:
        createProp(result, _obj, key);
        break;
    }
  }
  return result;
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
