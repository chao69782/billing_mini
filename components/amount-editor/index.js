const { formatDisplayDate, pad } = require('../../utils/date.js')

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    initialAmount: {
      type: String,
      value: '0',
      observer(newVal) {
        if (newVal) this.setData({ amount: String(newVal) });
      }
    },
    initialRemark: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal) this.setData({ remark: newVal });
      }
    },
    initialDate: {
      type: String,
      value: '',
      observer(newVal) {
        if (newVal) {
          this.initDate(newVal);
        } else {
          this.initDate();
        }
      }
    }
  },

  data: {
    amount: '0',
    remark: '',
    dateValue: '',
    dateDisplay: '今天'
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    },

    initDate(dateStr) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const targetDate = dateStr || todayStr;
      
      let display = targetDate === todayStr ? '今天' : formatDisplayDate(targetDate);
      
      this.setData({
        dateValue: targetDate,
        dateDisplay: display
      });
    },

    onRemarkInput(e) {
      this.setData({ remark: e.detail.value });
    },

    onDateChange(e) {
      const date = e.detail.value;
      const now = new Date();
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      
      let display = date === today ? '今天' : formatDisplayDate(date);
      
      this.setData({
        dateValue: date,
        dateDisplay: display
      });
    },

    getLastNumber(str) {
      const parts = str.split(/[+-]/);
      return parts[parts.length - 1];
    },

    onKeyTap(e) {
      const key = e.currentTarget.dataset.key;
      let { amount } = this.data;

      if (amount === '0') {
        if (key === '.') {
          amount = '0.';
        } else if (['+', '-'].includes(key)) {
          amount = '0' + key;
        } else {
          amount = key;
        }
      } else {
        // Prevent multiple dots in current number
        if (key === '.') {
          const lastNum = this.getLastNumber(amount);
          if (lastNum.includes('.')) return;
          amount += key;
        } 
        // Handle operators
        else if (['+', '-'].includes(key)) {
          // If last char is operator, replace it
          if (['+', '-'].includes(amount.slice(-1))) {
            amount = amount.slice(0, -1) + key;
          } else {
            amount += key;
          }
        } 
        // Handle numbers
        else {
          amount += key;
        }
      }
      this.setData({ amount });
    },

    onDeleteTap() {
      let { amount } = this.data;
      if (amount.length <= 1) {
        amount = '0';
      } else {
        amount = amount.slice(0, -1);
      }
      this.setData({ amount });
    },

    calculateResult() {
      try {
        let expr = this.data.amount;
        // Remove trailing operator
        if (['+', '-'].includes(expr.slice(-1))) {
          expr = expr.slice(0, -1);
        }
        
        // Simple calculation: replace - with +- then split by +
        // Note: this handles 1-2 as 1 + (-2)
        // But need to be careful with leading -
        let nums;
        if (expr.startsWith('-')) {
             // If starts with -, treat as 0-
             expr = '0' + expr;
        }
        
        nums = expr.replace(/-/g, '+-').split('+');
        const sum = nums.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
        
        return Math.round(sum * 100) / 100;
      } catch (err) {
        return 0;
      }
    },

    onSubmit() {
      const finalAmount = this.calculateResult();
      
      if (finalAmount <= 0) {
        wx.showToast({ title: '请输入有效金额', icon: 'none' });
        return;
      }

      this.triggerEvent('confirm', {
        amount: finalAmount,
        remark: this.data.remark,
        date: this.data.dateValue
      });
      // Do not close automatically? Or close? Usually close.
      // But parent might want to do async operation.
      // Let's close for now as UI feedback is immediate usually.
      this.onClose();
    }
  }
});