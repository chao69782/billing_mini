const app = getApp()
const { post, put } = require('../../utils/request.js'); // 导入请求模块

Page({
  data: {
    userInfo: null,
    hasLogin: false,
    loginLoading: false  // 添加登录加载状态
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 4, show: true })
    }
    this.setData({
      userInfo: app.globalData.userInfo,
      hasLogin: !!app.globalData.userInfo
    })
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key
    if (!this.data.hasLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (key === 'family-ledger') {
      wx.navigateTo({ url: '/pages/family/family' })
      return
    }
    if (key === 'calculator') {
      wx.navigateTo({ url: '/pages/calculator/calculator' })
      return
    }
    if (key === 'feedback') {
      wx.navigateTo({ url: '/pages/feedback/feedback' })
      return
    }
    wx.showToast({ title: '开发中...敬请期待', icon: 'none' })
  },

  onLogin() {
    // 设置登录加载状态
    this.setData({
      loginLoading: true
    });

    // 获取用户授权
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 获取登录凭证(code)
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 构建FormData格式的数据
              const formData = {
                code: loginRes.code
              };
              // 请求服务端登录接口，使用formdata格式
              post('/front/user/login', formData, undefined, true)
              .then(response => {
                // 登录成功，保存用户信息和token
                if (response && response.code === 0) {
                  const userData = response.data
                  const token = response.data.token
                  app.setUser(userData);
                  wx.setStorageSync('token', token);
                  
                  this.setData({
                    userInfo: userData,
                    hasLogin: true,
                    loginLoading: false  // 关闭加载状态
                  });
                  
                  wx.showToast({
                    title: '登录成功',
                    icon: 'success'
                  });
                  
                  // 登录成功后，返回记账页面
                  setTimeout(() => {
                    wx.switchTab({
                      url: '/pages/ledger/ledger'
                    });
                  }, 1000);
                } else {
                  wx.showToast({
                    title: response.message || '登录失败',
                    icon: 'none'
                  });
                  // 登录失败也要关闭加载状态
                  this.setData({
                    loginLoading: false
                  });
                }
              })
              .catch(error => {
                console.error('登录请求失败', error);
                wx.showToast({
                  title: '登录请求失败，请稍后重试',
                  icon: 'none'
                });
                // 登录失败也要关闭加载状态
                this.setData({
                  loginLoading: false
                });
              });
            } else {
              wx.showToast({
                title: '获取登录凭证失败',
                icon: 'none'
              });
              // 登录失败也要关闭加载状态
              this.setData({
                loginLoading: false
              });
            }
          },
          fail: () => {
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            });
            // 登录失败也要关闭加载状态
            this.setData({
              loginLoading: false
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '用户取消授权',
          icon: 'none'
        });
        // 用户取消授权也要关闭加载状态
        this.setData({
          loginLoading: false
        });
      }
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.setData({
            userInfo: null,
            hasLogin: false
          })
          wx.showToast({ title: '已退出', icon: 'none' })
        }
      }
    })
  }
})
