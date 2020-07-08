(function (window){
  
  const PENDING = "pending"
  const RESOLVED = "resolved"
  const REJECTED = "rejected"
  /**
  * @param {Function} executor 执行器
  * @return {Promise} A new instance of Promise
  * when catch error set promise.status to rejected
  */
  function Promise(executor){
    const self = this

    self.status = PENDING
    self.data = null
    self.callbacks = []
    
    function resolve(value){
      // 状态只能改变一次
      if(self.status !== PENDING){
        return
      }
      
      self.status = RESOLVED
      self.data = value
      if(self.callbacks.length>0){
        setTimeout(
          () => {
            self.callbacks.forEach(callbacksObj => {
              callbacksObj.onResolved(value)
            })
          }
        )
      }
    }
    function reject(reason){
      if(self.status !== PENDING){
        return
      }
      self.data = reason
      self.status = REJECTED
      if(self.callbacks.length>0){
        setTimeout(
          () => {
            self.callbacks.forEach(callbacksObj => {
              callbacksObj.onRejected(reason)
            })
          }
        )
    }
  }
    try {
      executor(resolve,reject)
    } catch (error) {
      reject(error)
    }
  }
  /**
  * @params {Function}... 回调函数 onResolved, onRejected
  * @return {Promise} A new instance of Promise
  * when catch error set promise.status to rejected with result error
  */
  Promise.prototype.then = function (onResolved,onRejected){
    const self = this
    // 给参数赋予默认值，默认的函数
    onResolved = typeof onResolved === "function" ? onResolved : value => value
    onRejected = typeof onRejected === "function" ? onRejected : reason => {throw reason}

    // 返回一个 promise
    return new Promise((resolve,reject)=>{
      // 定义 handler函数，处理回调函数(利用闭包)
      function handler(callback){
        /* 
        返回promise的结果由onResolved/onRejected执行结果决定
        1. 抛出异常, 返回promise的结果为失败, reason为异常
        2. 返回的是promise, 返回promise的结果就是这个结果
        3. 返回的不是promise, 返回promise为成功, value就是返回值
        */
        try {
          const result = callback(self.data)
          if(result instanceof Promise){
            result.then(resolve,reject)
          }else{
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }

      if(self.status === RESOLVED){
        // status 为 resolved 加入异步回调队列
        setTimeout(()=>{handler(onResolved)})
      }else if(self.status === REJECTED){
        // status 为 rejected 加入异步回调队列
        setTimeout(()=>{handler(onRejected)})
      }else{
        // status 为 pending  装入回调数组
        self.callbacks.push({
          onResolved(){
            // 改变状态
            handler(onResolved)
          },
          onRejected(){
            handler(onRejected)
          }
        })
      }
      })
  }
  /**
  * @param {Function} 回调函数 onResolved, onRejected
  * @return {Promise} A new instance of Promise
  * then的语法糖
  * when catch error set promise.status to rejected with result error
  */
  Promise.prototype.catch = function (onRejected){
    return  this.then(null,onRejected)
  }
  Promise.resolve = function(value){
    return new Promise((resolve,reject)=>{
      if(value instanceof Promise){
        value.then(resolve,reject)
      }else{
        resolve(value)
      }
    })
  }
  Promise.reject = function(reason){
    return new Promise((resolve,reject)=>{
      reject(reason)
    })
  }
  /**
  * @param {[Promise]} promises The Array of promise
  * @return {Promise} A new promise
  */
  Promise.all = function(promises){
    const values = new Array(promises.length)
    let resolvedCount = 0
    return new Promise((resolve,reject)=>{
      promises.forEach((p,index)=>{
        Promise.resolve(p).then(
          value =>{
            resolvedCount += 1
            values[index] = value
            if(resolvedCount===promises.length){
              resolve(values)
            }
          },
          reason =>{
            reject(reason)
          }
        )
      })
    })
  }
  /**
  * implement the sequence promise task
  * @param {[Promise]} things The Array of promise
  * @return {Promise} A new promise
  */
  Promise.queue = function (things) {
        let len = things.length
        let results = new Array(len)
        return things.reduce((total, cur, index) => {
          return total.then(() => {
            return cur.then((res) => {
              console.log(res)
              results[index] = res
              if (results.length == len) {
                return results
              }
            })
          })
        }, Promise.resolve())
      }
  /**
  * @param {[Promise]} promises The Array of promise
  * @return {Promise} A new promise
  */
  Promise.race = function(promises){
    return new Promise((resolve,reject)=>{
      promises.forEach((p)=>{
        Promise.resolve(p).then(
          value =>{
            resolve(value)
          },
          reason =>{
            reject(reason)
          }
        )
      })
    })
  }
  window.Promise = Promise

})(window)
