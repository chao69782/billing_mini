Page({
  data: {
    activeTab: 0, // 0: 等额本息, 1: 等额本金
    loanType: '', // commercial, provident, combination
    
    // Loan Details
    commercial: { amount: 0, years: 0, rate: 0 },
    provident: { amount: 0, years: 0, rate: 0 },

    // Calculation Results
    result: {
      totalPayment: 0, // Loan Amount (displayed)
      totalInterest: 0,
      totalRepayment: 0, // Principal + Interest
      months: 0,
      monthlyPayment: 0, // For Equal Interest (first month for Equal Principal)
      monthlyDecrease: 0, // For Equal Principal
      details: [] // Array of { period, payment, principal, interest, remaining }
    }
  },

  onLoad(options) {
    if (options.data) {
      const data = JSON.parse(decodeURIComponent(options.data));
      this.setData({
        loanType: data.type,
        commercial: data.commercial || { amount: 0, years: 0, rate: 0 },
        provident: data.provident || { amount: 0, years: 0, rate: 0 }
      });
      this.calculate();
    }
  },

  onTabClick(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ activeTab: index });
    this.calculate();
  },

  calculate() {
    const { activeTab, loanType, commercial, provident } = this.data;
    const isEqualPrincipal = activeTab === 1;

    let totalLoanAmount = 0;
    let totalInterest = 0;
    let details = [];
    
    // Helper function to calculate one loan part
    const calcPart = (amount, years, rate) => {
      if (!amount || !years) return { details: [], totalInterest: 0 };
      const months = years * 12;
      const monthlyRate = rate / 100 / 12;
      const principal = amount * 10000;
      let partDetails = [];
      let partInterest = 0;

      if (!isEqualPrincipal) {
        // 等额本息
        const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        let remaining = principal;
        for (let i = 1; i <= months; i++) {
          const interest = remaining * monthlyRate;
          const principalRepay = monthlyPayment - interest;
          remaining -= principalRepay;
          // Fix precision issues
          if (remaining < 0) remaining = 0;
          
          partInterest += interest;
          partDetails.push({
            period: i,
            payment: monthlyPayment,
            principal: principalRepay,
            interest: interest,
            remaining: remaining
          });
        }
      } else {
        // 等额本金
        const monthlyPrincipal = principal / months;
        let remaining = principal;
        for (let i = 1; i <= months; i++) {
          const interest = remaining * monthlyRate;
          const payment = monthlyPrincipal + interest;
          remaining -= monthlyPrincipal;
          if (remaining < 0) remaining = 0;

          partInterest += interest;
          partDetails.push({
            period: i,
            payment: payment,
            principal: monthlyPrincipal,
            interest: interest,
            remaining: remaining
          });
        }
      }
      return { details: partDetails, totalInterest: partInterest, principal: principal };
    };

    let commResult = calcPart(commercial.amount, commercial.years, commercial.rate);
    let provResult = calcPart(provident.amount, provident.years, provident.rate);

    // Merge results
    const maxMonths = Math.max(
      commercial.years ? commercial.years * 12 : 0,
      provident.years ? provident.years * 12 : 0
    );

    for (let i = 0; i < maxMonths; i++) {
      const commItem = commResult.details[i] || { payment: 0, principal: 0, interest: 0, remaining: 0 };
      const provItem = provResult.details[i] || { payment: 0, principal: 0, interest: 0, remaining: 0 };
      
      details.push({
        period: i + 1,
        payment: commItem.payment + provItem.payment,
        principal: commItem.principal + provItem.principal,
        interest: commItem.interest + provItem.interest,
        remaining: commItem.remaining + provItem.remaining
      });
    }

    totalLoanAmount = (commercial.amount || 0) + (provident.amount || 0);
    totalInterest = (commResult.totalInterest + provResult.totalInterest) / 10000; // Convert to Wan
    
    // Formatting
    const result = {
      totalPayment: totalLoanAmount.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      months: maxMonths / 12, // Display in years
      monthlyPayment: details.length > 0 ? details[0].payment.toFixed(2) : '0.00',
      monthlyDecrease: 0,
      details: details.map(d => ({
        ...d,
        payment: d.payment.toFixed(2),
        principal: d.principal.toFixed(2),
        interest: d.interest.toFixed(2),
        remaining: d.remaining.toFixed(2)
      }))
    };

    if (isEqualPrincipal && details.length > 1) {
      result.monthlyDecrease = (details[0].payment - details[1].payment).toFixed(2);
    }

    this.setData({ result });
  }
});
