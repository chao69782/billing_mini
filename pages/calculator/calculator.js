Page({
  data: {
    tabs: ['商业贷款', '组合贷款', '公积金贷款'],
    activeTab: 0,
    
    // Commercial Loan Data
    commCalculationMethod: 'amount', // 'amount' or 'price'
    commLoanAmount: '',
    commHousePrice: '',
    commLoanRatio: 6.5,
    commLoanTermIndex: 29, // Default 30 years (index 29)
    commRateMethodIndex: 0, // 0: LPR
    commLPR: '4.20', // Example LPR
    commRate: 3.45, // Commercial rate default

    // Combination Loan Data
    combProvidentAmount: '',
    combProvidentTermIndex: 29,
    combProvidentRate: 2.85, // Provident fund rate default (5+ years)
    combCommAmount: '',
    combCommTermIndex: 29,
    combCommRateMethodIndex: 0,
    combCommRate: 3.45,

    // Provident Fund Loan Data
    provLoanAmount: '',
    provLoanTermIndex: 29,
    provRate: 2.85,

    // Common Data
    loanTerms: [], // Generated 1-30 years
    rateMethods: ['按LPR', '按基准利率'],
  },

  onLoad() {
    this.initLoanTerms();
  },

  initLoanTerms() {
    const terms = [];
    for (let i = 1; i <= 30; i++) {
      terms.push(`${i}年`);
    }
    this.setData({ loanTerms: terms });
  },

  onTabClick(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
  },

  onCommMethodChange(e) {
    this.setData({ commCalculationMethod: e.detail.value });
  },

  // Input Handlers
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;
    
    // Validate number input
    // Allow digits and one dot
    
    this.setData({ [field]: value });
  },

  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: parseInt(e.detail.value) });
  },

  calculate() {
    let result = '';
    const { activeTab } = this.data;

    if (activeTab === 0) {
      // Commercial Loan
      let loanAmount = 0;
      if (this.data.commCalculationMethod === 'amount') {
        loanAmount = parseFloat(this.data.commLoanAmount);
      } else {
        const price = parseFloat(this.data.commHousePrice);
        const ratio = parseFloat(this.data.commLoanRatio);
        if (price && ratio) {
          loanAmount = price * ratio / 10;
        }
      }

      if (!loanAmount) {
        wx.showToast({ title: '请输入金额', icon: 'none' });
        return;
      }

      const years = this.data.commLoanTermIndex + 1;
      const rate = parseFloat(this.data.commRate);
      
      this.navigateToResult({
        type: 'commercial',
        commercial: { amount: loanAmount, years, rate }
      });

    } else if (activeTab === 1) {
      // Combination Loan
      const provAmount = parseFloat(this.data.combProvidentAmount);
      const commAmount = parseFloat(this.data.combCommAmount);
      
      if (!provAmount && !commAmount) {
        wx.showToast({ title: '请输入金额', icon: 'none' });
        return;
      }

      const provYears = this.data.combProvidentTermIndex + 1;
      const provRate = parseFloat(this.data.combProvidentRate);
      const commYears = this.data.combCommTermIndex + 1;
      const commRate = parseFloat(this.data.combCommRate);

      this.navigateToResult({
        type: 'combination',
        commercial: { amount: commAmount, years: commYears, rate: commRate },
        provident: { amount: provAmount, years: provYears, rate: provRate }
      });

    } else {
      // Provident Fund Loan
      const loanAmount = parseFloat(this.data.provLoanAmount);
      if (!loanAmount) {
        wx.showToast({ title: '请输入金额', icon: 'none' });
        return;
      }

      const years = this.data.provLoanTermIndex + 1;
      const rate = parseFloat(this.data.provRate);

      this.navigateToResult({
        type: 'provident',
        provident: { amount: loanAmount, years, rate }
      });
    }
  },

  navigateToResult(data) {
    wx.navigateTo({
      url: `/pages/calculator/result/result?data=${encodeURIComponent(JSON.stringify(data))}`
    });
  },

  // Calculate Equal Principal and Interest
  calculateMonthlyPayment(principal, years, annualRate) {
    if (annualRate === 0) return principal / (years * 12);
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }
});
