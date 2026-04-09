const app = getApp()
const { formatDisplayDate, pad } = require('../../utils/date.js')
const { get, post} = require('../../utils/request.js');
Page({
  data: {
    categoryType: 1,
    categoryList: [],
    selectedCategory: null,
    selectedCategoryName: '',
    selectedCategoryIcon: '',
    amount: '0',
    remark: '',
    dateValue: '',
    dateDisplay: '今天',
    tempInput: ''
  },

  onLoad() {
    this.getCategoriesByType(this.data.categoryType)
    this.initDate()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 2, show: false })
    }
    this.getCategoriesByType(this.data.categoryType)
  },

  initDate() {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    this.setData({
      dateValue: dateStr,
      dateDisplay: '今天'
    })
  },
  getCategoriesByType(categoryType){
    const formData = {
      categoryType: categoryType
    };
    get('/front/category/listByCategoryType', formData, undefined, true).then(res => {
      if(res.code === 0){
        const categoryList = res.data || []
        this.setData({
          categoryType,
          categoryList,
          // selectedCategory: categoryList.length > 0 ? categoryList[0].key : null // 移除默认选中
        })
      }

    })
  },

  onSwitchType(e) {
    const categoryType = parseInt(e.currentTarget.dataset.type)
    if (categoryType === this.data.categoryType) return
    this.getCategoriesByType(categoryType)
  },

  onSelectCategory(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    const icon = e.currentTarget.dataset.icon
    this.setData({ selectedCategory: id, selectedCategoryName: name, selectedCategoryIcon: icon })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onDateChange(e) {
    const date = e.detail.value
    const now = new Date()
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    
    let display = date === today ? '今天' : formatDisplayDate(date)
    
    this.setData({
      dateValue: date,
      dateDisplay: display
    })
  },

  // 键盘逻辑
  onKeyTap(e) {
    const key = e.currentTarget.dataset.key
    let { amount } = this.data

    if (amount === '0') {
      if (key === '.') {
        amount = '0.'
      } else if (['+', '-'].includes(key)) {
        amount = '0' + key
      } else {
        amount = key
      }
    } else {
      // 防止重复小数点
      if (key === '.' && this.getLastNumber(amount).includes('.')) return
      // 防止连续运算符
      if (['+', '-'].includes(key) && ['+', '-'].includes(amount.slice(-1))) {
        amount = amount.slice(0, -1) + key
      } else {
        amount += key
      }
    }

    this.setData({ amount })
  },

  getLastNumber(str) {
    const parts = str.split(/[+-]/)
    return parts[parts.length - 1]
  },

  onDeleteTap() {
    let { amount } = this.data
    if (amount.length <= 1) {
      amount = '0'
    } else {
      amount = amount.slice(0, -1)
    }
    this.setData({ amount })
  },

  calculateResult() {
    try {
      // 简单的计算逻辑
      let expr = this.data.amount
      // 去除末尾运算符
      if (['+', '-'].includes(expr.slice(-1))) {
        expr = expr.slice(0, -1)
      }
      
      // 简单的加减计算
      // 替换 - 为 +-, 然后 split +
      const nums = expr.replace(/-/g, '+-').split('+')
      const sum = nums.reduce((acc, curr) => acc + parseFloat(curr || 0), 0)
      
      return Math.round(sum * 100) / 100
    } catch (err) {
      return 0
    }
  },

  onSubmit() {
    const { selectedCategory,selectedCategoryName,selectedCategoryIcon,categoryType,dateValue, remark } = this.data
    
    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    const finalAmount = this.calculateResult()
    
    if (finalAmount <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' })
      return
    }

    const record = {
      categoryName:selectedCategoryName,
      categoryIcon:selectedCategoryIcon,
      recordType:categoryType,
      amount: finalAmount,
      recordTime: dateValue,
      remark: remark
    }
    post('/front/record/add', record, undefined, false).then(res => {
      if(res.code === 0){
        wx.showToast({ title: '记好了', icon: 'success' })
        // 重置状态
        this.setData({
          amount: '0',
          remark: ''
        })
        
        // 如果是从tabbar进来的，通常跳转回明细页
        wx.switchTab({ url: '/pages/ledger/ledger' })
      } else {
        wx.showToast({ title: res.msg, icon: 'error' })
      }
    })
  },

  onCancel() {
    wx.switchTab({ url: '/pages/ledger/ledger' })
  },

  onSettings() {
    wx.navigateTo({
      url: '/pages/category-settings/category-settings'
    })
  }
})