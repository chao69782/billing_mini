const app = getApp()

Component({
  options: {
    addGlobalClass: true,
    styleIsolation: 'apply-shared'
  },
  data: {
    active: 0,
    show: true,
    list: [
      { pagePath: '/pages/ledger/ledger', text: '账本', icon: 'icon-zhangben' },
      { pagePath: '/pages/charts/charts', text: '图表', icon: 'icon-tubiao-zhexiantu' },
      { pagePath: '/pages/record/record', text: '记账', icon: 'icon-jiahao1' },
      { pagePath: '/pages/discovery/discovery', text: '发现', icon: 'icon-faxian' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: 'icon-wode' }
    ]
  },
  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index
      const path = this.data.list[idx].pagePath
      if (idx === 2 && !app.checkLogin()) {
        wx.switchTab({ url: '/pages/mine/mine' })
        this.setData({ active: 4 })
        return
      }
      wx.switchTab({ url: path })
      this.setData({ active: idx })
    }
  }
})
