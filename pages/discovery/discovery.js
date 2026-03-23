const { get, post } = require('../../utils/request.js');
const app = getApp()
Page({
  data: {
    monthStr: '',
    monthNum: '',
    income: '0.00',
    expense: '0.00',
    balance: '0.00',
    // 预算相关数据
    totalBudget: '0.00',
    remainBudget: '0.00',
    monthExpense: '0.00',
    budgetPercent: 0
  },
  onLoad() {
    this.updateMonth()
    this.onRefresh(this.data.monthStr)
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 3, show: true })
    }
    // 返回时刷新一次，保证跨月后显示正确
    this.updateMonth()
    this.onRefresh(this.data.monthStr)
  },
  onRefresh(monthStr) {
    this.getMonthIncomeAndExpense(monthStr)
    this.getBudgetInfo(monthStr)
  },

  getMonthIncomeAndExpense(monthStr){
    get('/front/record/getMonthIncomeAndExpense', { month: monthStr }).then(res => {
      if (res.code === 0) {
        const income = parseFloat(res.data.income || 0);
        const expense = parseFloat(res.data.expense || 0);
        this.setData({
          income: income.toFixed(2),
          expense: expense.toFixed(2),
          balance: (income - expense).toFixed(2)
        })
      }
    })
  },
  // 获取预算信息
  getBudgetInfo(monthStr) {
    get('/front/budget/get', { monthStr: monthStr }).then(res => {
      if (res && res.code === 0) {
        const data = res.data || {}
        this.setData({
          totalBudget: data.totalBudget || '0.00',
          remainBudget: data.remainBudget || '0.00',
          monthExpense: data.monthExpense || '0.00',
          budgetPercent: data.budgetPercent || 0
        })
      }
    })
  },
  // 设置预算
  onSetBudget() {
    if (!app.requireLogin()) {
      return
    }
    const budget = String(this.data.totalBudget || '0.00')
    wx.showModal({
      title: '设置本月预算',
      placeholderText: '请输入预算金额',
      editable: true,
      content: budget === '0.00' ? '' : budget,
      success: (res) => {
        if (res.confirm) {
          const amount = parseFloat(res.content)
          if (isNaN(amount) || amount < 0) {
            wx.showToast({ title: '请输入有效金额', icon: 'none' })
            return
          }
          if (amount > 1000000) {
            wx.showToast({ title: '预算金额不能超过100万', icon: 'none' })
            return
          }
          
          post('/front/budget/set', { 
            monthStr: this.data.monthStr,
            budget: amount
          }).then(r => {
            if (r && r.code === 0) {
              wx.showToast({ title: '设置成功', icon: 'success' })
              this.getBudgetInfo(this.data.monthStr)
            }
          })
        }
      },
      fail: (err) => {
        console.error('showModal failed', err)
        wx.showToast({ title: '无法打开弹窗', icon: 'none' })
      }
    })
  },
  updateMonth() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    this.setData({
      monthStr: `${y}-${m}`,
      monthNum: m
    })
  },
  
  onCalculatorTap() {
    wx.navigateTo({
      url: '/pages/calculator/calculator'
    })
  },

  onBillCardTap() {
    wx.navigateTo({
      url: '/pages/bill-detail/bill-detail'
    })
  }
})
