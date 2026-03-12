/**
 * 封装微信小程序网络请求
 */
const app = getApp()
const BASE_URL = 'http://192.168.1.4:9526/api';

// Loading计数器，用于处理并发请求
let requestCount = 0;
// 存储每个请求的 loading 定时器
let loadingTimer = null;

/**
 * 显示Loading
 */
function showLoading() {
  if (requestCount === 0) {
    // 延迟 1 秒显示 loading
    loadingTimer = setTimeout(() => {
      wx.showLoading({
        title: '加载中',
        mask: true
      });
    }, 1000);
  }
  requestCount++;
}

/**
 * 隐藏Loading
 */
function hideLoading() {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0; // 归零保护
    // 如果请求结束时定时器还在，说明没到 1 秒，直接清除定时器，不显示 loading
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    // 尝试隐藏 loading (即使没显示也不会报错，或者是为了关闭已经显示的)
    wx.hideLoading();
  }
}

function getToken() {
  const token = wx.getStorageSync('token');
  return token ? 'Bearer ' + token : '';
}

/**
 * 统一请求处理函数
 * @param {Object} options - 请求参数
 * @returns {Promise}
 */
function request(options) {
  // 请求开始显示loading
  showLoading();
  
  return new Promise((resolve, reject) => {
    // 检查是否使用FormData格式
    let contentType = 'application/json';
    let requestData = options.data || {};
    
    if (options.useFormdata) {
      // 如果使用FormData格式，需要改变请求头
      contentType = 'application/x-www-form-urlencoded';
    }
    
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: requestData,
      header: {
        'Content-Type': contentType,
        'Authorization': getToken(), // 使用统一的getToken方法
        ...options.header
      },
      timeout: options.timeout || 10000, // 设置默认超时时间
      success: (res) => {
        // 请求结束隐藏loading
        hideLoading();
        
        if(res.statusCode === 200){
          if(res.data.code === 10020001){
            app.logout()
            wx.showToast({
              title: '请先登录！',
              icon: 'none'
            })
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/mine/mine'
              });
            }, 1000);
          } else if(res.data.code != 0) {
            wx.showToast({ title: res.data.msg, icon: 'none' })
          }
          resolve(res.data);
        } else {
          // 处理错误状态码
          handleHttpError(res);
          reject(res);
        }
      },
      fail: (err) => {
        // 请求失败隐藏loading
        hideLoading();
        
        wx.showToast({
      title: '系统繁忙，请稍后再试！',
      icon: 'none'
    });
        reject(err);
      }
    });
  });
}

/**
 * 处理HTTP错误
 * @param {Object} res - 响应对象
 */
function handleHttpError(res) {
  if(res.statusCode === 200){
    wx.showToast({
      title: res.data.msg,
      icon: 'none'
    });

  } else {
    wx.showToast({
      title: '系统繁忙，请稍后再试！',
      icon: 'none'
    });
  }
}

/**
 * GET请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Number} timeout - 超时时间
 * @returns {Promise}
 */
function get(url, data = {}, timeout) {
  return request({
    url,
    method: 'GET',
    data,
    timeout
  });
}

/**
 * POST请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Number} timeout - 超时时间
 * @param {Boolean} useFormdata - 是否使用formdata格式
 * @returns {Promise}
 */
function post(url, data = {}, timeout, useFormdata = false) {
  return request({
    url,
    method: 'POST',
    data,
    timeout,
    useFormdata: useFormdata
  });
}

/**
 * PUT请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Number} timeout - 超时时间
 * @returns {Promise}
 */
function put(url, data = {}, timeout,useFormdata = false) {
  return request({
    url,
    method: 'PUT',
    data,
    timeout,
    useFormdata:useFormdata
  });
}

/**
 * DELETE请求
 * @param {String} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Number} timeout - 超时时间
 * @returns {Promise}
 */
function del(url, data = {}, timeout,useFormdata = false) {
  return request({
    url,
    method: 'DELETE',
    data,
    timeout,
    useFormdata:useFormdata
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  BASE_URL,
  getToken
};
