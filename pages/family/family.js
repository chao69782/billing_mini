const app = getApp()
const { get, post, del } = require('../../utils/request.js')

Page({
  data: {
    inviteCode: '',
    inputCode: '',
    members: [],
    bindLoading: false,
    editId: null,
    editRemark: '',
    saveLoading: false,
    isMember: false, // 是否是成员身份
    isOwner: false,  // 是否是管理员身份
    currentUserId: '' // 当前用户ID
  },
  onLoad() {
    this.setData({
      currentUserId: app.globalData.userInfo.id || ''
    })
    this.refresh()
  },
  onShow() {
    this.setData({
      inviteCode: app.globalData.userInfo.inviteCode || '',
    })
    this.refresh()
  },
  refresh() {
    this.getMembers()
  },
  onBack() {
    wx.navigateBack()
  },
  getMembers() {
    get('/front/family/members', {}, undefined, true).then(res => {
      if (res && res.code === 0) {
        const members = res.data || []
        // 判断当前用户角色
        const currentUserId = this.data.currentUserId || app.globalData.userInfo.id
        const currentUser = members.find(m => String(m.userId) === String(currentUserId))
        const isOwner = currentUser && currentUser.role === 0
        const isMember = currentUser && currentUser.role === 1
        
        this.setData({ 
          members,
          isOwner: !!isOwner,
          isMember: !!isMember
        })
      }
    })
  },
  onInputCode(e) {
    this.setData({ inputCode: e.detail.value })
  },
  onCopy() {
    if (!this.data.inviteCode) return
    wx.setClipboardData({ data: this.data.inviteCode })
  },
  onStartEditRemark(e) {
    const id = e.currentTarget.dataset.id
    const remark = e.currentTarget.dataset.remark || ''
    wx.showModal({
      title: '修改备注',
      content: remark,
      editable: true,
      placeholderText: '请输入备注',
      confirmText: '保存',
      success: (res) => {
        if (res.confirm) {
          const newRemark = (res.content || '').trim()
          if (newRemark === remark) return
          this.setData({ saveLoading: true })
          post('/front/family/editRemark', { id, remark: newRemark }, undefined, true)
            .then(r => {
              if (r && r.code === 0) {
                wx.showToast({ title: '已保存', icon: 'success' })
                this.refresh()
              }
            })
            .catch(() => wx.showToast({ title: '请求失败', icon: 'none' }))
            .finally(() => this.setData({ saveLoading: false }))
        }
      }
    })
  },
  onBind() {
    const code = (this.data.inputCode || '').trim()
    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    this.setData({ bindLoading: true })
    post('/front/family/join', { code }, undefined, true)
      .then(res => {
        if (res && res.code === 0) {
          wx.showToast({ title: '已加入', icon: 'success' })
          this.setData({ inputCode: '' })
          this.refresh()
        }
      })
      .catch(() => {
        wx.showToast({ title: '请求失败', icon: 'none' })
      })
      .finally(() => {
        this.setData({ bindLoading: false })
      })
  },
  onRemove(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '移除成员',
      content: '确定移除该成员？',
      success: (res) => {
        if (!res.confirm) return
        del('/front/family/remove', { id }, undefined, true).then(r => {
          if (r && r.code === 0) {
            wx.showToast({ title: '已移除', icon: 'none' })
            this.refresh()
          } else {
            wx.showToast({ title: r.message || '操作失败', icon: 'none' })
          }
        })
      }
    })
  },
  onQuitFamily() {
    wx.showModal({
      title: '退出家庭',
      content: '确定退出当前家庭？',
      success: (res) => {
        if (!res.confirm) return
        del('/front/family/quit', {}, undefined, true).then(r => {
          if (r && r.code === 0) {
            wx.showToast({ title: '已退出', icon: 'success' })
            setTimeout(() => {
              this.refresh()
            }, 1000)
          } else {
            wx.showToast({ title: r.message || '操作失败', icon: 'none' })
          }
        })
      }
    })
  }
})
