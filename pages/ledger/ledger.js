const app = getApp()
const { get, del, put } = require('../../utils/request.js');

Page({
  data: {
    year: new Date().getFullYear(),
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    summary: { income: 0, expense: 0 },
    summaryIncomeText: '0.00',
    summaryExpenseText: '0.00',
    recordList: [],
    empty: true,
    headerRightPadding: 0,
    startX: 0,
    startY: 0,
    openedGroupIndex: -1,
    openedIndex: -1,
    showCategoryPicker: false,
    showAmountEditor: false,
    currentRecord: null,
    fabX: 0,
    fabY: 0,
    isDraggingFab: false, // 是否正在拖拽悬浮按钮
    fabStartX: 0,
    fabStartY: 0,
    hasLogin: false,
    canScroll: false,
    scrollTop: 0
  },

  onLoad() {
    const win = wx.getWindowInfo()
    // 右侧尽量少留白，让 summary 统计框尽量往右拓宽
    // const paddingRight = win.windowWidth - menu.left - 50
    // this.setData({ headerRightPadding: Math.max(0, Math.ceil(paddingRight)) })

    // Cache pixel ratio for slide calculations
    this.pixelRatio = 750 / win.windowWidth;
    // 初始悬浮按钮位置：左上
    const margin = 16;
    const x = margin;
    const y = 100;
    this.setData({
      fabX: x,
      fabY: y
    });
    this.onRefresh()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 0, show: true })
    }
    this.setData({
      hasLogin: !!app.globalData.userInfo
    });
    this.onRefresh()
  },
  onRefresh() {
    let { year, month } = this.data
    this.getRecordList(year, month)
  },

  getRecordList(year, month) {
    let time = year + '-' + month;
    const formData = {
      time: time
    };
    get('/front/record/list', formData, undefined, true).then(res => {
      const recordList = res.data || [];
      // 计算总收入和总支出
      let totalIncome = 0;
      let totalExpense = 0;

      recordList.forEach(group => {
        group.list.forEach(item => {
          item.translateX = 0;
          item.transition = true;
        });
        totalIncome += parseFloat(group.totalIncome) || 0;
        totalExpense += parseFloat(group.totalExpense) || 0;
      });

      this.setData({
        recordList,
        empty: !res.data || res.data.length === 0,
        summary: {
          income: totalIncome,
          expense: totalExpense
        },
        summaryIncomeText: totalIncome.toFixed(2),
        summaryExpenseText: totalExpense.toFixed(2),
        // 切换月份或刷新时，重置滚动条位置
        scrollTop: 0
      }, () => {
        // 延迟执行，确保渲染完成
        setTimeout(() => {
          this.updateScrollAbility();
        }, 100);
      })
    })

  },

  updateScrollAbility() {
    // 只要不是空状态，就允许滚动
    // 这样避免了计算高度的误差导致无法滚动
    this.setData({ canScroll: !this.data.empty });
  },

  onDateChange(e) {
    const value = e.detail.value; // e.g. "2026-03"
    const [year, month] = value.split('-');
    this.setData({ year, month });
    this.getRecordList(year, month);
  },

  onPrevMonth() {
    let { year, month } = this.data;

    // 转换为数字进行运算
    let prevMonth = parseInt(month, 10) - 1;
    let prevYear = year;

    // 处理跨年情况
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear--;
    }

    // 格式化月份
    const formattedMonth = this.formatMonth(prevMonth);

    // 边界校验（可选：限制最小年份）
    const minYear = 2020; // 假设最小年份为 2020
    if (prevYear < minYear) {
      return; // 阻止切换到更早的年份
    }

    // 更新数据并刷新记录列表
    this.setData({ year: prevYear, month: formattedMonth });
    this.getRecordList(prevYear, formattedMonth);
  },

  onNextMonth() {
    let { year, month } = this.data;
    const now = new Date();

    // 转换为数字进行比较
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 如果已经是当前月份，禁止继续切换
    if (year === currentYear && parseInt(month, 10) === currentMonth) {
      return;
    }

    // 月份自增
    let nextMonth = parseInt(month, 10) + 1;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    // 格式化月份
    const formattedMonth = this.formatMonth(nextMonth);

    // 边界校验
    if (this.isFutureDate(nextYear, formattedMonth)) {
      return;
    }

    // 更新数据并重新加载记录
    this.setData({ year: nextYear, month: formattedMonth });
    this.getRecordList(nextYear, formattedMonth);
  },

  deleteRecord(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除',
      content: '确定删除这条记录？',
      success: res => {
        if (res.confirm) {
          const formData = {
            id: id
          };
          del("/front/record/delete", formData, undefined, true).then(res => {
            if (res.code === 0) {
              this.setData({
                openedGroupIndex: -1,
                openedIndex: -1
              })
              let { year, month } = this.data
              this.getRecordList(year, month)
            }
          })
        }
      }
    })
  },
  touchStart(e) {
    const { groupIndex, index } = e.currentTarget.dataset;
    const { openedGroupIndex, openedIndex } = this.data;

    if (openedGroupIndex !== -1 && (openedGroupIndex !== groupIndex || openedIndex !== index)) {
      const key = `recordList[${openedGroupIndex}].list[${openedIndex}].translateX`;
      this.setData({
        [key]: 0,
        openedGroupIndex: -1,
        openedIndex: -1
      });
    }

    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY
    });

    // Disable transition during drag
    const key = `recordList[${groupIndex}].list[${index}].transition`;
    this.setData({ [key]: false });
  },

  touchMove(e) {
    const { groupIndex, index } = e.currentTarget.dataset;
    const startX = this.data.startX;
    const startY = this.data.startY;
    const moveX = e.changedTouches[0].clientX;
    const moveY = e.changedTouches[0].clientY;

    const disX = startX - moveX;
    const disY = startY - moveY;

    // If vertical scroll is dominant, ignore
    if (Math.abs(disY) > Math.abs(disX)) return;

    let translateX = 0;
    if (disX > 0) { // Slide left
      // Convert distance to rpx equivalent for logic if needed, 
      // but here we just map px to rpx for display
      const rpx = disX * this.pixelRatio;

      translateX = -rpx;
      if (translateX < -140) translateX = -140;
    }

    const key = `recordList[${groupIndex}].list[${index}].translateX`;
    this.setData({ [key]: translateX });
  },

  touchEnd(e) {
    const { groupIndex, index } = e.currentTarget.dataset;
    const startX = this.data.startX;
    const endX = e.changedTouches[0].clientX;
    const disX = startX - endX;

    const rpx = disX * this.pixelRatio;

    let finalX = 0;
    let isOpen = false;

    if (rpx > 70) { // Threshold to snap open (half of button width)
      finalX = -140;
      isOpen = true;
    }

    const tKey = `recordList[${groupIndex}].list[${index}].transition`;
    const xKey = `recordList[${groupIndex}].list[${index}].translateX`;

    this.setData({
      [tKey]: true,
      [xKey]: finalX,
      openedGroupIndex: isOpen ? groupIndex : -1,
      openedIndex: isOpen ? index : -1
    });
  },

  // 格式化月份为两位数
  formatMonth(month) {
    return month.toString().padStart(2, '0');
  },
  // 边界校验：确保年份和月份不超过当前时间
  isFutureDate(year, month) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return year > currentYear || (year === currentYear && parseInt(month, 10) > currentMonth);
  },

  goToRecordPage() {
    if (!app.requireLogin()) {
      return
    } else {
      wx.switchTab({
        url: '/pages/record/record'
      });
    }

  },
  onBillCardTap() {
    wx.navigateTo({
      url: '/pages/bill-detail/bill-detail'
    })
  },

  onEditCategory(e) {
    const record = e.currentTarget.dataset.record;
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ show: false });
    }
    this.setData({
      currentRecord: record,
      showCategoryPicker: true,
    });
  },

  onCloseCategoryPicker() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ show: true });
    }
    this.setData({ showCategoryPicker: false });
  },

  onCategorySelected(e) {
    const category = e.detail.category;
    const { currentRecord } = this.data
    const formData = {
      id: currentRecord.id,
      categoryName: category.categoryName || null,
      categoryIcon: category.categoryIcon || null,
      recordType: category.categoryType || null
    };

    this.updateRecord(formData);
  },

  onEditAmount(e) {
    const record = e.currentTarget.dataset.record;
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ show: false });
    }
    this.setData({
      currentRecord: record,
      showAmountEditor: true
    });
  },

  onCloseAmountEditor() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ show: true });
    }
    this.setData({ showAmountEditor: false });
  },

  onAmountConfirmed(e) {
    const { amount, remark, date } = e.detail;
    const { currentRecord } = this.data;

    const formData = {
      id: currentRecord.id,
      amount: amount || null,
      recordTime: date || null,
      remark: remark || null
    };

    this.updateRecord(formData);
  },

  updateRecord(formData) {
    put('/front/record/edit', formData, undefined).then(res => {
      if (res.code === 0) {
        let { year, month } = this.data;
        this.getRecordList(year, month);
        this.onCloseCategoryPicker();
        this.onCloseAmountEditor();
      }
    });
  },
  openAssistant() {
    if (!app.requireLogin()) {
      return
    }
    wx.navigateTo({
      url: '/pages/assistant/assistant'
    })
  },

  // 悬浮按钮触摸开始
  onFabTouchStart(e) {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      this.setData({
        isDraggingFab: true,
        fabStartX: touch.clientX,
        fabStartY: touch.clientY
      });
    } else {
      // 兼容处理，万一没有 touch 信息
      this.setData({ isDraggingFab: true });
    }
  },

  // 悬浮按钮触摸结束
  onFabTouchEnd(e) {
    this.setData({ isDraggingFab: false });

    if (e.changedTouches && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      // 确保 fabStartX 存在
      if (this.data.fabStartX !== undefined) {
        const diffX = Math.abs(touch.clientX - this.data.fabStartX);
        const diffY = Math.abs(touch.clientY - this.data.fabStartY);

        // 位移小于 5px 视为点击
        if (diffX < 5 && diffY < 5) {
          this.openAssistant();
        }
      }
    }
  },

  // 悬浮按钮位置改变（可选，用于记录最后位置）
  onFabChange(e) {
    // e.detail.x, e.detail.y
  }
})
