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

  function filterObject(filter) {
    var result = {};

    for (let key in obj) {
      if (filter(key)) switch (filter) {
        case filters.getter:
          result[key] = () => obj[key];
          break;

        case filters.mutation:
          const setter = Object.getOwnPropertyDescriptor(obj, key).set;
          result[key] = (state, payload) => setter.call(obj, payload);
          break;

        case filters.action:
          const args = getArgs(obj[key]);

          result[key] = (context, payload) => {
            if (args.indexOf('rootState') > -1)
              payload['rootState'] = context.rootState;
            if (args.indexOf('rootGetters') > -1)
              payload['rootGetters'] = context.rootGetters;

            if (!obj['commit'] || !obj['dispatch']) {
              obj['commit'] = context.commit;
              obj['dispatch'] = context.dispatch;
            }

            return obj[key].apply(obj, isObject(payload) ? args.map(value => payload[value]) : [payload]);
          }
          break;

        case filters.state: default:
          Object.defineProperty(result, key, {
            configurable: false,
            enumerable: true,
            get: () => obj[key],
            set: value => obj[key] = value
          });
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

function isObject(obj) {
  return !!obj && obj.toString() === '[object Object]';
}

function getArgs(func) {
  const comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  const args = /([^\s,]+)/g;
  let fnStr = func.toString().replace(comments, '');
  return fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(args) || [];
}
