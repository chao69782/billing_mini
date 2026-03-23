const { post } = require('../../utils/request.js');

Page({
  data: {
    content: '',
    contact: '1',
    submitting: false
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  onSubmit() {
    if (!this.data.content) return;
    if (this.data.submitting) return;

    this.setData({ submitting: true });

    const formData = {
      content: this.data.content,
      contact: this.data.contact
    };

    post('/front/feedback/save', formData, undefined).then(res => {
      if (res.code === 0) {
        wx.showToast({ title: '反馈成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        // request.js already handles error toast for non-zero codes
        this.setData({ submitting: false });
      }
    }).catch(() => {
      this.setData({ submitting: false });
    });
  }
})