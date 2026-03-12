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
        this.updateSummary().then(() => {
          this.getRankingList(currentTime, this.data.type);
        });
      }
    })
  },
  
  getTotalsFor(time, recordType){
    const formData = { time, recordType };
    return get('/front/record/getRankingList', formData, undefined, true).then(res => {
      if(res.code !== 0) return 0;
      const list = res.data || [];
      let sum = 0;
      list.forEach(i => { sum += parseFloat(i.amount) || 0; });
      return sum;
    }).catch(() => 0);
  },

  updateSummary(){
    const time = this.data.currentTime;
    if(!time) return Promise.resolve();
    const prevTime = this.data.dateRange === 'month'
      ? (function(t){
          const [y,m]=t.split('-').map(Number);
          const d=new Date(y, m-2, 1);
          const yy=d.getFullYear();
          const mm=(d.getMonth()+1).toString().padStart(2,'0');
          return yy + '-' + mm;
        })(time)
      : (String(Number(time)-1));
    return Promise.all([
      this.getTotalsFor(time,1),
      this.getTotalsFor(time,2),
      this.getTotalsFor(prevTime,1),
      this.getTotalsFor(prevTime,2)
    ]).then(([eNow,iNow,ePrev,iPrev])=>{
      const maxNow = Math.max(eNow, iNow, 1);
      const expensePercent = Math.round(eNow / maxNow * 100);
      const incomePercent = Math.round(iNow / maxNow * 100);
      this.setData({
        totalExpense: eNow.toFixed(2),
        totalIncome: iNow.toFixed(2),
        currentBalance: (iNow - eNow).toFixed(2),
        previousBalance: (iPrev - ePrev).toFixed(2),
        expensePercent,
        incomePercent
      });
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
            totalExpense: totalAmount.toFixed(2),
            pieChartGradient: pieChartGradient
          });
        } else { // 收入
          this.setData({
            rankingList: rankingList,
            totalIncome: totalAmount.toFixed(2),
            pieChartGradient: pieChartGradient
          });
        }
      } else {
        // 请求失败时清零
        if (this.data.type === 1) {
          this.setData({
            rankingList: [],
            totalExpense: 0
          });
        } else {
          this.setData({
            rankingList: [],
            totalIncome: 0
          });
        }
      }
    }).catch(err => {
      console.error('获取排行榜数据失败:', err);
      // 错误处理，清零对应数据
      if (this.data.type === 1) {
        this.setData({
          rankingList: [],
          totalExpense: 0
        });
      } else {
        this.setData({
          rankingList: [],
          totalIncome: 0
        });
      }
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
    this.updateSummary().then(()=>{
      this.getRankingList(this.data.currentTime, type);
    });
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
    this.updateSummary().then(()=>{
      this.getRankingList(this.data.currentTime, this.data.type);
    });
  }
})
