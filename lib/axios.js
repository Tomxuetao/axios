'use strict';

import utils from './utils.js';
import bind from './helpers/bind.js';
import Axios from './core/Axios.js';
import mergeConfig from './core/mergeConfig.js';
import defaults from './defaults/index.js';
import formDataToJSON from './helpers/formDataToJSON.js';
import CanceledError from './cancel/CanceledError.js';
import CancelToken from './cancel/CancelToken.js';
import isCancel from './cancel/isCancel.js';
import {VERSION} from './env/data.js';
import toFormData from './helpers/toFormData.js';
import AxiosError from './core/AxiosError.js';
import spread from './helpers/spread.js';
import isAxiosError from './helpers/isAxiosError.js';
import AxiosHeaders from "./core/AxiosHeaders.js";
import adapters from './adapters/adapters.js';
import HttpStatusCode from './helpers/HttpStatusCode.js';

/**
 * Create an instance of Axios 创建axios实例的方法
 *
 * @param {Object} defaultConfig The default config for the instance
 *
 * @returns {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  // 根据默认配置构建个上下文对象，包括默认配置和请求、响应拦截器对象
  const context = new Axios(defaultConfig);
  // 创建实例 bind后返回的是一个函数，并且上下文指向context
  const instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance // 拷贝prototype到实例上 类似于把Axios的原型上的方法(例如: request、get、post...)继承到实例上，this指向为context
  utils.extend(instance, Axios.prototype, context, {allOwnKeys: true});

  // Copy context to instance 拷贝上下文对象属性(默认配置和请求、相应拦截器对象)到实例上， this指向为context
  utils.extend(instance, context, null, {allOwnKeys: true});

  // Factory for creating new instances 创建axios实例，一般axios封装 应该都会用到 （我们把一些默认、公共的配置都放到一个实例上，复用实例，无需每次都重新创建实例）
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported 创建实例 default 为默认配置
const axios = createInstance(defaults);

// Expose Axios class to allow class inheritance 向外暴露Axios类，可用于继承 （本人暂未使用过）
axios.Axios = Axios;

// Expose Cancel & CancelToken 这里抛出 中断/取消请求的相关方法到入口对象
axios.CanceledError = CanceledError;
axios.CancelToken = CancelToken;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData;

// Expose AxiosError class 用作监测是否为Axios抛出的错误
axios.AxiosError = AxiosError;

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread 并发请求 完全就是用promise的能力
axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

// Expose mergeConfig
axios.mergeConfig = mergeConfig;

axios.AxiosHeaders = AxiosHeaders;

axios.formToJSON = thing => formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);

axios.getAdapter = adapters.getAdapter;

axios.HttpStatusCode = HttpStatusCode;

axios.default = axios;

// this module should only have a default export
export default axios
