const { get } = require('../../utils/request.js');

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    defaultType: {
      type: Number,
      value: 1, // 1: expense, 2: income
      observer(newVal) {
        if (newVal) {
          this.setData({ categoryType: newVal });
          this.getCategoriesByType(newVal);
        }
      }
    },
    selectedId: {
      type: String,
      value: null,
      observer(newVal) {
        this.setData({ selectedCategory: newVal });
      }
    }
  },

  data: {
    categoryType: 1,
    categoryList: [],
    selectedCategory: null
  },

  lifetimes: {
    attached() {
      // If no data loaded yet, load default
      if (this.data.categoryList.length === 0) {
        this.getCategoriesByType(this.data.categoryType);
      }
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    },

    onSwitchType(e) {
      const type = parseInt(e.currentTarget.dataset.type);
      if (type === this.data.categoryType) return;
      this.setData({ categoryType: type });
      this.getCategoriesByType(type);
    },

    getCategoriesByType(categoryType) {
      const formData = {
        categoryType: categoryType
      };
      get('/front/category/listByCategoryType', formData, undefined, true).then(res => {
        if (res.code === 0) {
          this.setData({
            categoryList: res.data || []
          });
        }
      });
    },

    onSelectCategory(e) {
      const { id, item } = e.currentTarget.dataset;
      this.setData({ selectedCategory: id });
      this.triggerEvent('select', { category: item });
      this.onClose();
    }
  }
});