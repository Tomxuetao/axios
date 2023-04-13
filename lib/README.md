```
lib                                     -- 项目源代码包
├── adapters                            
│   ├── README.md                       
│   ├── adapters.js                     -- 
│   ├── http.js                         -- node环境http对象
│   └── xhr.js                          -- 浏览器环境XML对象
├── axios.js                            -- 入口，创建构造函数
├── cancel                              -- 定义取消请求功能
│   ├── CancelToken.js                  --
│   ├── CanceledError.js                --
│   └── isCancel.js                     --
├── core                                -- 一些核心功能
│   ├── Axios.js                        -- axios实例构造函数
│   ├── AxiosError.js                   -- 抛出错误
│   ├── AxiosHeaders.js                 --
│   ├── InterceptorManager.js           --
│   ├── README.md                       --
│   ├── buildFullPath.js                --
│   ├── dispatchRequest.js              --
│   ├── mergeConfig.js                  --
│   ├── settle.js                       --
│   └── transformData.js                --
├── defaults                            -- 默认配置
│   ├── index.js                        --
│   └── transitional.js                 --
├── env                                 -- 环境
│   ├── README.md                       --
│   ├── classes                         --
│   │   └── FormData.js                 --
│   └── data.js                         --
├── helpers                             -- 辅助方法
│   ├── AxiosTransformStream.js         --
│   ├── AxiosURLSearchParams.js         --
│   ├── HttpStatusCode.js               --
│   ├── README.md                       --
│   ├── ZlibHeaderTransformStream.js    --
│   ├── bind.js                         --
│   ├── buildURL.js                     --
│   ├── combineURLs.js                  --
│   ├── cookies.js                      --
│   ├── deprecatedMethod.js             --
│   ├── formDataToJSON.js               --
│   ├── formDataToStream.js             --
│   ├── fromDataURI.js                  --
│   ├── isAbsoluteURL.js                --
│   ├── isAxiosError.js                 --
│   ├── isURLSameOrigin.js              --
│   ├── null.js                         --
│   ├── parseHeaders.js                 --
│   ├── parseProtocol.js                --
│   ├── readBlob.js                     --
│   ├── speedometer.js                  --
│   ├── spread.js                       --
│   ├── throttle.js                     --
│   ├── toFormData.js                   --
│   ├── toURLEncodedForm.js             --
│   └── validator.js                    --
├── platform                            --
│   ├── browser                         --
│   │   ├── classes                     --
│   │   │   ├── Blob.js                 --
│   │   │   ├── FormData.js             --
│   │   │   └── URLSearchParams.js      --
│   │   └── index.js                    --
│   ├── index.js                        --
│   └── node                            --
│       ├── classes                     --
│       │   ├── FormData.js             --
│       │   └── URLSearchParams.js      --
│       └── index.js                    --
└── utils.js                            --
```
