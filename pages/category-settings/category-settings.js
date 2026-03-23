const { get, post, del, put } = require('../../utils/request.js');

Page({
  data: {
    currentType: 1, // 1: 支出, 2: 收入
    categories: [],
    dragging: false,
    dragIndex: -1,
    ghostY: 0,
    ghostItem: null,
    scrollTop: 0,
    itemHeight: 0,
    // Modal state
    showModal: false,
    modalMode: 'add', // 'add' | 'edit'
    modalTitle: '添加类别',
    editId: null,
    categoryNameInput: '',
    selectedIcon: 'icon-gamepad',
    iconGroups: [
      {
        name: '生活与餐饮',
        icons: [
          'icon-canyin', 'icon-riyong', 'icon-shucai', 'icon-shuiguo', 'icon-lingshi', 
          'icon-coffee', 'icon-cup', 'icon-cake', 'icon-meirong', 'icon-scissors', 'icon-sparkles',
          'icon-zhufang', 'icon-building', 'icon-key', 'icon-yanjiu', 'icon-home', 'icon-heart', 'icon-fire',
          'icon-gift', 'icon-jiating', 'icon-sun', 'icon-moon'
        ]
      },
      {
        name: '购物与交通',
        icons: [
          'icon-gouwu', 'icon-shopping-bag', 'icon-cart', 'icon-fushi',
          'icon-shopping-bag-2', 'icon-jiaotong', 'icon-qiche', 'icon-truck', 'icon-truck-fast',
          'icon-map', 'icon-globe', 'icon-paper-airplane', 'icon-gift'
        ]
      },
      {
        name: '休闲与娱乐',
        icons: [
          'icon-yule', 'icon-yundong', 'icon-gamepad', 'icon-music', 'icon-microphone', 'icon-film', 'icon-play',
          'icon-camera', 'icon-camera-2', 'icon-ticket', 'icon-paint-brush', 'icon-yuyin'
        ]
      },
      {
        name: '办公与学习',
        icons: [
          'icon-xuexi', 'icon-academic-cap', 'icon-book', 'icon-briefcase', 'icon-calculator', 'icon-computer', 'icon-device-tablet',
          'icon-phone', 'icon-envelope', 'icon-pencil', 'icon-document', 'icon-printer', 'icon-presentation-chart', 'icon-jianpan'
        ]
      },
      {
        name: '金融与收入',
        icons: [
          'icon-gongzi', 'icon-jiangjin', 'icon-licai', 'icon-jianzhi', 'icon-lijin',
          'icon-credit-card', 'icon-wallet', 'icon-currency-dollar', 'icon-banknotes',
          'icon-chart-bar', 'icon-chart-bar-square', 'icon-chart-pie', 'icon-tubiao-zhexiantu', 'icon-shouru', 'icon-zhichu'
        ]
      },
      {
        name: '其他杂项',
        icons: [
          'icon-qita', 'icon-yiliao', 'icon-tongxun', 'icon-kefu', 'icon-yijian',
          'icon-user', 'icon-chongwu', 'icon-bug-ant', 'icon-star', 'icon-face-smile', 'icon-band-aid', 'icon-bell', 'icon-megaphone', 'icon-calendar', 'icon-clock',
          'icon-cloud', 'icon-bolt', 'icon-wrench', 'icon-light-bulb', 'icon-wifi', 'icon-archive', 'icon-shield-check', 'icon-heart-pulse',
          'icon-faxian'
        ]
      }
    ]
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ currentType: parseInt(options.type) });
    }
    // Calculate item height in px
    const res = wx.getSystemInfoSync();
    // 120rpx in px
    const itemHeight = 120 * (res.windowWidth / 750);
    this.setData({ itemHeight });
    
    this.getCategories();
  },

  onScroll(e) {
    // Only update scrollTop locally, avoid setData for better performance
    this._scrollTop = e.detail.scrollTop;
  },

  initDrag(args) {
    const index = args.index;
    this._dragStartIndex = index;

    const { categories } = this.data;
    const item = categories[index];
    
    // Use createSelectorQuery to get precise position relative to the movable-area (.list)
    const query = this.createSelectorQuery();
    query.select(`#item-${index}`).boundingClientRect();
    query.select('.list').boundingClientRect();
    query.exec((res) => {
      // Check if drag was cancelled or changed
      if (this._dragStartIndex !== index) return;

      const itemRect = res[0];
      const listRect = res[1];
      
      if (itemRect && listRect) {
        // Calculate y relative to the list container
        // This accounts for any scrolling or offset
        const y = itemRect.top - listRect.top;
        
        this.setData({
          dragging: true,
          dragIndex: index,
          ghostItem: item,
          ghostY: y
        });
        
        wx.vibrateShort();
      }
    });
  },

  checkSwap(args) {
    const targetIndex = args.targetIndex;
    const { categories, dragIndex } = this.data;
    
    if (targetIndex !== dragIndex) {
      // Swap items
      const newCategories = [...categories];
      const [movedItem] = newCategories.splice(dragIndex, 1);
      newCategories.splice(targetIndex, 0, movedItem);
      
      this.setData({
        categories: newCategories,
        dragIndex: targetIndex
      });
      
      wx.vibrateShort({ type: 'light' });
    }
  },

  endDrag() {
    this._dragStartIndex = -1; // Clear intent
    this.setData({
      dragging: false,
      dragIndex: -1,
      ghostItem: null
    });
    // Save order logic here
    this.saveOrder();
  },

  saveOrder() {
    // 假设后端接口为 /front/category/sort，接收一个 ID 列表
    // ids: [id1, id2, id3, ...] 按顺序排列
    const ids = this.data.categories.map(item => item.id);
    
    // 使用 post 请求调用排序接口
    put('/front/category/sort', ids).then(res => {
      if (res.code === 0) {

      } else {
        wx.showToast({ title: res.msg || '排序保存失败', icon: 'none' });
      }
    });
  },


  getCategories() {
    const { currentType } = this.data;
    get('/front/category/listByCategoryType', { categoryType: currentType }, undefined, true).then(res => {
      if (res.code === 0) {
        this.setData({ categories: res.data || [] });
      }
    });
  },

  switchType(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type === this.data.currentType) return;
    this.setData({ currentType: type });
    this.getCategories();
  },

  onDeleteTap(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除类别',
      content: `确定要删除"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteCategory(id);
        }
      }
    });
  },

  deleteCategory(id) {
    del('/front/category/delete', { id }, undefined, true).then(res => {
      if (res.code === 0) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.getCategories();
      } else {
        wx.showToast({ title: res.msg || '删除失败', icon: 'none' });
      }
    });
  },

  onAddCategory() {
    this.setData({
      showModal: true,
      modalMode: 'add',
      modalTitle: this.data.currentType === 1 ? '添加支出类别' : '添加收入类别',
      categoryNameInput: '',
      selectedIcon: 'icon-canyin',
      editId: null
    });
  },

  onEditCategory(e) {
    const { id, name } = e.currentTarget.dataset;
    // 找到当前项获取 icon
    const item = this.data.categories.find(c => c.id === id);
    const icon = item ? item.categoryIcon : 'icon-canyin';

    this.setData({
      showModal: true,
      modalMode: 'edit',
      modalTitle: '修改类别',
      categoryNameInput: name,
      selectedIcon: icon,
      editId: id
    });
  },

  closeModal() {
    this.setData({
      showModal: false
    });
  },

  onInputCategoryName(e) {
    this.setData({
      categoryNameInput: e.detail.value
    });
  },

  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      selectedIcon: icon
    });
  },

  submitCategory() {
    const { modalMode, editId, categoryNameInput, selectedIcon, currentType } = this.data;
    const name = categoryNameInput.trim();
    
    if (!name) {
      wx.showToast({ title: '请输入类别名称', icon: 'none' });
      return;
    }

    if (modalMode === 'add') {
      post('/front/category/add', {
        categoryName: name,
        categoryType: currentType,
        categoryIcon: selectedIcon
      }).then(res => {
        if (res.code === 0) {
          wx.showToast({ title: '添加成功', icon: 'success' });
          this.closeModal();
          this.getCategories();
        } else {
          wx.showToast({ title: res.msg || '添加失败', icon: 'none' });
        }
      });
    } else if (modalMode === 'edit') {
      put('/front/category/edit', {
        id: editId,
        categoryName: name,
        categoryIcon: selectedIcon
      }).then(res => {
        if (res.code === 0) {
          wx.showToast({ title: '修改成功', icon: 'success' });
          this.closeModal();
          this.getCategories();
        } else {
          wx.showToast({ title: res.msg || '修改失败', icon: 'none' });
        }
      });
    }
  }
});
