'use strict';

import utils from './../utils.js';
import buildURL from '../helpers/buildURL.js';
import InterceptorManager from './InterceptorManager.js';
import dispatchRequest from './dispatchRequest.js';
import mergeConfig from './mergeConfig.js';
import buildFullPath from './buildFullPath.js';
import validator from '../helpers/validator.js';
import AxiosHeaders from './AxiosHeaders.js';

const validators = validator.validators;

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 *
 * @return {Axios} A new instance of Axios
 */
class Axios {
  constructor(instanceConfig) {
    // 这里创建的请求和响应拦截器 通过统一的类构造出来的
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }

  /**
   * Dispatch a request 主请求 方法 所有请求最终都会指向这个方法
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy;

        Error.captureStackTrace ? Error.captureStackTrace(dummy = {}) : (dummy = new Error());

        // slice off the Error: ... line
        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
        try {
          if (!err.stack) {
            err.stack = stack;
            // match without the 2 top stack lines
          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
            err.stack += '\n' + stack
          }
        } catch (e) {
          // ignore the case where "stack" is an un-writable property
        }
      }

      throw err;
    }
  }

  _request(configOrUrl, config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    // 判断参数类型 以支持不同的请求形式axios('url',config) / axios(config)
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    // 配置合并默认配置
    config = mergeConfig(this.defaults, config);

    const {transitional, paramsSerializer, headers} = config;

    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }

    if (paramsSerializer != null) {
      if (utils.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        }
      } else {
        validator.assertOptions(paramsSerializer, {
          encode: validators.function,
          serialize: validators.function
        }, true);
      }
    }

    // Set config.method 转化请求的方法 转化为小写
    config.method = (config.method || this.defaults.method || 'get').toLowerCase();

    // Flatten headers
    let contextHeaders = headers && utils.merge(
      headers.common,
      headers[config.method]
    );

    headers && utils.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      (method) => {
        delete headers[method];
      }
    );

    config.headers = AxiosHeaders.concat(contextHeaders, headers);

    // filter out skipped interceptors 请求拦截器储存数组
    const requestInterceptorChain = [];
    // 默认所有请求拦截器都为同步
    let synchronousRequestInterceptors = true;
    // 遍历注册好的请求拦截器数组
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      // 这里interceptor是注册的每一个拦截器对象 axios请求拦截器向外暴露了runWhen配置来针对一些需要运行时检测来执行的拦截器
      // 如果配置了该函数，并且返回结果为true，则记录到拦截器链中，反之则直接结束该层循环
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }
      
      // interceptor.synchronous 是对外提供的配置，可标识该拦截器是异步还是同步 默认为false(异步)
      // 这里是来同步整个执行链的执行方式的，如果有一个请求拦截器为异步 那么下面的promise执行链则会有不同的执行方式
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      
      // 塞到请求拦截器数组中
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    
    // 相应拦截器存储数组
    const responseInterceptorChain = [];
    // 遍历按序push到拦截器存储数组中
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    let i = 0;
    let len;

    // 如果为异步 其实也是默认情况
    if (!synchronousRequestInterceptors) {
      // 创建存储链式调用的数组 首位是核心调用方法dispatchRequest，第二位是空
      const chain = [dispatchRequest.bind(this), undefined];
      // 请求拦截器塞到前面
      chain.unshift.apply(chain, requestInterceptorChain);
      // 响应拦截放到后面
      chain.push.apply(chain, responseInterceptorChain);
      len = chain.length;

      promise = Promise.resolve(config);

      // 循环 执行
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }

      return promise;
    }
    
    len = requestInterceptorChain.length;

    let newConfig = config;

    i = 0;

    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    // 到这里 微任务不会过早的创建 也就解决了 微任务过早创建、当前宏任务过长或某个请求拦截器中有异步任务而阻塞真正的请求延时发起问题
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    i = 0;
    len = responseInterceptorChain.length;

    // 响应拦截器执行
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }

    return promise;
  }
  
  /**
   * 获取完成的请求url方法
   *
   * @param config
   * @returns {string|*}
   */
  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url,
        data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

export default Axios;
