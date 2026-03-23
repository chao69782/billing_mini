const { get } = require('../../utils/request.js');

const CHART_COLORS = ['#7A73F0', '#00D68F', '#F8961E', '#FFDA44', '#00B4D8', '#FF6B6B', '#9B5DE5', '#F15BB5'];

Page({
  data: {
    type: 1, // 1: 支出, 2: 收入
    showTypeMenu: false, // 控制下拉菜单显示
    dateRange: 'month', // month, year
    timeList: [], // 时间列表
    currentTime: '', // 当前选中时间
    totalExpense: 0,
    totalIncome: 0,
    rankingList: [],
    scrollIntoView: '', // 控制滚动条位置
    brandYellow: '#FFDA44',
    currentBalance: '0.00',
    previousBalance: '0.00',
    expensePercent: 0,
    incomePercent: 0,
    pieChartGradient: ''
  },

  onLoad() {
    const app = getApp();
    if (app && app.globalData && app.globalData.brandYellow) {
      this.setData({ brandYellow: app.globalData.brandYellow });
    }
    this.getTimeList('month');
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ active: 1, show: true })
    }
    this.getTimeList('month');
  },
  
  // 获取记账时间列表
  getTimeList(range){
    const formData = {
      timeType: range
    };
    get('/front/record/getTimeList', formData, undefined, true).then(res => {
      if(res.code === 0){
        const timeList = res.data || []
        const currentTime = timeList.length > 0 ? timeList[timeList.length - 1] : '';
        // 找到选中项的索引
        const currentIndex = timeList.indexOf(currentTime);
        const targetIndex = currentIndex !== -1 ? currentIndex : timeList.length - 1;
        this.setData({
          timeList: timeList,
          dateRange: range,
          // 默认选中时间列表的最后一个时间
          currentTime: currentTime,
          scrollIntoView: 'item-' + targetIndex
        })
        this.getRankingList(currentTime, this.data.type);
        this.loadTrendData();
      }
    })
  },

  setSummaryData(eNow, iNow) {
    const maxNow = Math.max(eNow, iNow, 1);
    const expensePercent = Math.round(eNow / maxNow * 100);
    const incomePercent = Math.round(iNow / maxNow * 100);
    this.setData({
      totalExpense: parseFloat(eNow).toFixed(2),
      totalIncome: parseFloat(iNow).toFixed(2),
      currentBalance: (parseFloat(iNow) - parseFloat(eNow)).toFixed(2),
      expensePercent,
      incomePercent
    });
  },

  getRankingList(currentTime, recordType){
    const formData = {
      time: currentTime,
      recordType: recordType
    };
    get('/front/record/getRankingList', formData, undefined, true).then(res => {
      if(res.code === 0){
        let rankingList = res.data || [];
        // 计算总金额
        let totalAmount = 0;
        let currentAngle = 0;
        let gradientStops = [];
        
        rankingList.forEach((item, index) => {
          // 假设每个项目都有一个amount字段表示金额
          totalAmount += parseFloat(item.amount) || 0;
          
          // 分配颜色
          item.color = CHART_COLORS[index % CHART_COLORS.length];
          
          // 计算饼图角度
          const percent = parseFloat(item.percent) || 0;
          const angle = (percent / 100) * 360;
          const endAngle = currentAngle + angle;
          
          gradientStops.push(`${item.color} ${currentAngle}deg ${endAngle}deg`);
          currentAngle = endAngle;
        });

        // 补全最后的角度到360度（如果有精度误差）
        if (currentAngle > 0 && currentAngle < 360) {
          const lastColor = rankingList[rankingList.length - 1].color;
          gradientStops[gradientStops.length - 1] = `${lastColor} ${parseFloat(gradientStops[gradientStops.length - 1].split(' ')[1])}deg 360deg`;
        }

        const pieChartGradient = rankingList.length > 0 
          ? `conic-gradient(${gradientStops.join(', ')})` 
          : 'conic-gradient(#F5F5F5 0deg 360deg)';
        
        // 根据recordType设置对应的数据
        if (recordType === 1) { // 支出
          this.setData({
            rankingList: rankingList,
            pieChartGradient: pieChartGradient
          });
        } else { // 收入
          this.setData({
            rankingList: rankingList,
            pieChartGradient: pieChartGradient
          });
        }
      } else {
        // 请求失败时清空排行
        this.setData({
          rankingList: []
        });
      }
    }).catch(err => {
      console.error('获取排行榜数据失败:', err);
      // 错误处理，清空排行
      this.setData({
        rankingList: []
      });
    });
  },

  // 切换下拉菜单显示状态
  toggleTypeMenu() {
    this.setData({
      showTypeMenu: !this.data.showTypeMenu
    });
  },

  // 选择类型（支出/收入）
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      type: Number(type),
      showTypeMenu: false
    });
    this.getRankingList(this.data.currentTime, type);
    this.loadTrendData();
  },

  // 切换时间范围（月/年）
  switchRange(e) {
    const range = e.currentTarget.dataset.range;
    if (range === this.data.dateRange) return;
    this.getTimeList(range);
  },

  // 选择具体时间点
  selectTime(e) {
    const time = e.currentTarget.dataset.time;
    const index = e.currentTarget.dataset.index;
    this.setData({ 
      currentTime: time,
      scrollIntoView: 'item-' + index // 点击时滚动到该项
    });
    this.getRankingList(this.data.currentTime, this.data.type);
    this.loadTrendData();
  },

  loadTrendData() {
    const { currentTime, dateRange, type } = this.data;
    if (!currentTime) return;

    if (dateRange === 'month') {
      // 获取某月的每日数据
      get('/front/record/list', { time: currentTime }, undefined, true).then(res => {
        let points = [];
        // 获取当前月有多少天
        const [y, m] = currentTime.split('-');
        const daysInMonth = new Date(y, m, 0).getDate();
        
        // 初始化数据
        for (let i = 1; i <= daysInMonth; i++) {
          points.push({ label: i.toString(), value: 0 });
        }

        let eNow = 0;
        let iNow = 0;

        if (res.code === 0 && res.data) {
          res.data.forEach(group => {
            eNow += parseFloat(group.totalExpense || 0);
            iNow += parseFloat(group.totalIncome || 0);
            if (group.date) {
              const parts = group.date.split('-');
              const dayStr = parts.length >= 3 ? parts[2] : parts[parts.length - 1];
              const day = parseInt(dayStr);
              const val = type === 1 ? parseFloat(group.totalExpense) : parseFloat(group.totalIncome);
              if (day >= 1 && day <= daysInMonth) {
                points[day - 1].value = val || 0;
              }
            }
          });
        }
        this.setSummaryData(eNow, iNow);
        this.drawLineChart(points);
      });
    } else {
      // 获取某年的每月数据
      get('/front/record/getMonthBillList', { year: currentTime }, undefined, true).then(res => {
        let points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ label: i.toString(), value: 0 });
        }
        
        let eNow = 0;
        let iNow = 0;

        if (res.code === 0 && res.data) {
          res.data.forEach(item => {
            eNow += parseFloat(item.expense || 0);
            iNow += parseFloat(item.income || 0);
            const month = parseInt(item.timeStr);
            const val = type === 1 ? parseFloat(item.expense) : parseFloat(item.income);
            if (month >= 1 && month <= 12) {
              points[month - 1].value = val || 0;
            }
          });
        }
        this.setSummaryData(eNow, iNow);
        this.drawLineChart(points);
      });
    }
  },

  drawLineChart(data) {
    const query = wx.createSelectorQuery();
    query.select('#trendChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const width = res[0].width;
        const height = res[0].height;
        
        const dpr = wx.getWindowInfo().pixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        this.renderLineChart(ctx, width, height, data);
      });
  },

  renderLineChart(ctx, width, height, data) {
    ctx.clearRect(0, 0, width, height);
    if (!data || data.length === 0) return;

    const padding = { top: 20, right: 20, bottom: 30, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxDataVal = Math.max(...data.map(d => d.value));
    const maxVal = maxDataVal > 0 ? maxDataVal * 1.2 : 100;
    
    // 绘制Y轴刻度线
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + chartHeight - (i / ySteps) * chartHeight;
      const val = ((maxVal / ySteps) * i).toFixed(0);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      ctx.fillText(val, padding.left - 8, y);
    }

    // 绘制X轴标签
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const stepX = chartWidth / (data.length - 1 || 1);
    
    const labelStep = Math.ceil(data.length / 6); 

    data.forEach((d, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const x = padding.left + i * stepX;
        ctx.fillText(d.label, x, height - padding.bottom + 8);
      }
    });

    // 绘制折线
    ctx.beginPath();
    ctx.strokeStyle = this.data.brandYellow || '#FFDA44';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    data.forEach((d, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartHeight - (d.value / maxVal) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 填充渐变区域
    ctx.lineTo(padding.left + (data.length - 1) * stepX, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    const hex = this.data.brandYellow || '#FFDA44';
    let r = 255, g = 218, b = 68;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
})
