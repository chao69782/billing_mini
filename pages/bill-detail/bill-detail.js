const { get } = require('../../utils/request.js');

Page({
  data: {
    tabs: ['月账单', '年账单'],
    activeTab: 0,
    currentYear: new Date().getFullYear(),
    years: [], // 2020-2100
    
    // Month Bill Data
    monthList: [],
    yearSummary: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00'
    },

    // Year Bill Data
    yearList: [],
    totalSummary: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00'
    },

    brandYellow: '#FFDA44',
    pickerIndex: 0
  },

  onLoad() {
    this.initYears();
    this.initPickerIndex();
    this.loadData();
  },

  initYears() {
    const years = [];
    for (let i = 2020; i <= 2100; i++) {
      years.push(i + '年');
    }
    this.setData({ years });
  },

  initPickerIndex() {
    const { years, currentYear } = this.data;
    const index = years.findIndex(y => parseInt(y) === currentYear);
    if (index !== -1) {
      this.setData({ pickerIndex: index });
    }
  },

  onTabClick(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ activeTab: index });
    this.loadData();
  },

  onYearChange(e) {
    const index = e.detail.value;
    const selectedYear = parseInt(this.data.years[index]);
    this.setData({ 
      currentYear: selectedYear,
      pickerIndex: index
    });
    this.loadData();
  },

  loadData() {
    const { activeTab, currentYear } = this.data;
    
    // Mock Data Logic
    // In a real app, this would be an API call
    // GET /front/record/getYearStats { year: currentYear } for Tab 0
    // GET /front/record/getAllStats for Tab 1
    
    if (activeTab === 0) {
      // Month Bill (Yearly breakdown by month)
      this.getMonthBillData(currentYear);
    } else {
      // Year Bill (All time breakdown by year)
      this.getYearBillData();
    }
  },

  getYearBillData() {
    get('/front/record/getYearBillList', {}, undefined, true).then(res => {
      if (res && res.code === 0 && res.data) {
        const data = res.data;
        
        if (!Array.isArray(data)) {
          console.error('API returned non-array data', data);
          return;
        }

        let totalIncome = 0;
        let totalExpense = 0;
        const list = [];

        // Sort data by timeStr descending (e.g. "2025", "2024"...)
        data.sort((a, b) => parseInt(b.timeStr) - parseInt(a.timeStr));

        data.forEach(item => {
          const income = parseFloat(item.income || 0);
          const expense = parseFloat(item.expense || 0);
          const balance = (income - expense).toFixed(2);
          
          // timeStr is the year
          const yearStr = item.timeStr + '年';

          list.push({
            year: yearStr,
            income: income.toFixed(2),
            expense: expense.toFixed(2),
            balance: balance
          });

          totalIncome += income;
          totalExpense += expense;
        });

        this.setData({
          yearList: list,
          totalSummary: {
            income: totalIncome.toFixed(2),
            expense: totalExpense.toFixed(2),
            balance: (totalIncome - totalExpense).toFixed(2)
          }
        });
      } else {
        this.setData({
          yearList: [],
          totalSummary: {
            income: '0.00',
            expense: '0.00',
            balance: '0.00'
          }
        });
      }
    }).catch(err => {
      console.error('获取年账单失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  getMonthBillData(year) {
    const formData = {
      year: year
    };
    get('/front/record/getMonthBillList', formData, undefined, true).then(res => {
      if (res && res.code === 0 && res.data) {
        const data = res.data;
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('API returned non-array data', data);
          return;
        }

        let totalIncome = 0;
        let totalExpense = 0;
        const list = [];

        // Sort data by timeStr descending (e.g. "12", "11"...)
        data.sort((a, b) => parseInt(b.timeStr) - parseInt(a.timeStr));

        data.forEach(item => {
          const income = parseFloat(item.income || 0);
          const expense = parseFloat(item.expense || 0);
          const balance = (income - expense).toFixed(2);
          
          // timeStr is like "02", convert to "2月"
          const monthNum = parseInt(item.timeStr);
          const monthStr = monthNum + '月';

          list.push({
            month: monthStr,
            income: income.toFixed(2),
            expense: expense.toFixed(2),
            balance: balance
          });

          totalIncome += income;
          totalExpense += expense;
        });

        this.setData({
          monthList: list,
          yearSummary: {
            income: totalIncome.toFixed(2),
            expense: totalExpense.toFixed(2),
            balance: (totalIncome - totalExpense).toFixed(2)
          }
        });
      } else {
        // Handle empty or error case
        this.setData({
          monthList: [],
          yearSummary: {
            income: '0.00',
            expense: '0.00',
            balance: '0.00'
          }
        });
      }
    }).catch(err => {
      console.error('获取月账单失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },
  
});
