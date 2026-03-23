const STORAGE_RECORDS = 'billing_records'
const STORAGE_USER = 'billing_user'
const TOKEN =  'token'

App({
  globalData: {
    userInfo: null,
    brandYellow: '#FFDA44',
    brandYellowDark: '#FFC107',
    env: wx.getAccountInfoSync().miniProgram.envVersion,
    localEnv: 'develop'
  },

  onLaunch() {
    this.loadUser()
  },
  loadUser() {
    try {
      const raw = wx.getStorageSync(STORAGE_USER)
      this.globalData.userInfo = raw ? JSON.parse(raw) : null
    } catch (e) {
      this.globalData.userInfo = null
    }
  },

  setUser(info) {
    this.globalData.userInfo = info
    wx.setStorageSync(STORAGE_USER, JSON.stringify(info))
  },

  // 检查用户是否已登录
  checkLogin() {
    return !!this.globalData.userInfo;
  },

  // 检查是否登录，若未登录则提示并跳转到我的页面
  requireLogin() {
    if (!this.checkLogin()) {
      wx.showToast({
        title: '请先登录！',
        icon: 'none'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/mine/mine'
        });
      }, 1000);
      return false;
    }
    return true;
  },

  logout(){
    wx.removeStorageSync(STORAGE_USER)
    wx.removeStorageSync(TOKEN)
    this.globalData.userInfo = null
  }
})
