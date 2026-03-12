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

  logout(){
    wx.removeStorageSync(STORAGE_USER)
    wx.removeStorageSync(TOKEN)
    this.globalData.userInfo = null
  }
})
