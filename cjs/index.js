'use strict';Object.defineProperty(exports,'__esModule',{value:!0}),exports.objectToStore=objectToStore;function objectToStore(a){var b=1<arguments.length&&arguments[1]!==void 0&&arguments[1];return{namespaced:b,state:filterObject(filters.state,a),getters:filterObject(filters.getter,a),mutations:filterObject(filters.mutation,a),actions:filterObject(filters.action,a)}}var filters=function(){var a=function(a,b){return Object.getOwnPropertyDescriptor(a,b)},b=function(b,c){return!!b&&!!c&&!!a(b,c)},c=function(a,b){return'function'==typeof a[b]};return{state:function state(d,e){return b(d,e)&&!a(d,e).get&&!a(d,e).set&&!c(d,e)},getter:function getter(d,e){return b(d,e)&&a(d,e).get&&!a(d,e).set&&!c(d,e)},mutation:function mutation(d,e){return b(d,e)&&!a(d,e).get&&a(d,e).set&&!c(d,e)},action:function action(a,d){return b(a,d)&&c(a,d)}}}();function filterObject(a,b){var c={},d=function(d){if(a(b,d))switch(a){case filters.getter:c[d]=function(){return b[d]};break;case filters.mutation:c[d]=createMutation(b,d);break;case filters.action:c[d]=createAction(b,d);break;case filters.state:default:createProp(c,b,d);}};for(var e in b)d(e);return c}function createProp(a,b,c){Object.defineProperty(a,c,{configurable:!1,enumerable:!0,get:function get(){return b[c]},set:function set(a){return b[c]=a}})}function createMutation(a,b){var c=Object.getOwnPropertyDescriptor(a,b).set;return function(b,d){return c.call(a,d)}}function createAction(a,b){var c=getArgs(a[b]);return function(d,e){return a.commit&&a.dispatch&&a.rootState&&a.rootGetters||(a.commit=d.commit,a.dispatch=d.dispatch,a.rootState=d.rootState,a.rootGetters=d.rootGetters),a[b].apply(a,isObject(e)?c.map(function(a){return e[a]}):[e])}}function isObject(a){return!!a&&'[object Object]'===a.toString()}function getArgs(a){var b=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,c=/([^\s,]+)/g,d=a.toString().replace(b,'');return d.slice(d.indexOf('(')+1,d.indexOf(')')).match(c)||[]}