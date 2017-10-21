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
  const desc = (obj, prop) => Object.getOwnPropertyDescriptor(obj, prop);
  const isValid    = (obj, prop) => !!obj && !!prop && !!desc(obj, prop);
  const isFunction = (obj, prop) => typeof obj[prop] === 'function';

  return {
    state: (obj, prop) => isValid(obj, prop) && !desc(obj, prop).get && !desc(obj, prop).set && !isFunction(obj, prop),
    getter: (obj, prop) => isValid(obj, prop) && desc(obj, prop).get && !desc(obj, prop).set && !isFunction(obj, prop),
    mutation: (obj, prop) => isValid(obj, prop) && !desc(obj, prop).get && desc(obj, prop).set && !isFunction(obj, prop),
    action: (obj, prop) => isValid(obj, prop) && isFunction(obj, prop)
  }
}());

function filterObject(filter, obj) {
  var result = {};
  for (let key in obj) {
    if (filter(obj, key)) {
      if (filter === filters.getter)
        result[key] = () => obj[key];

      else if (filter === filters.mutation)
        result[key] = createMutation(obj, key);

      else if (filter === filters.action)
        result[key] = createAction(obj, key);

      else createProp(result, obj, key);
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
