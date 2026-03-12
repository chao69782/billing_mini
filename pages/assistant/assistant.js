const { BASE_URL, getToken, get } = require('../../utils/request.js');
const app = getApp();

Page({
  data: {
    inputValue: '',
    messages: [
      { id: 1, role: 'assistant', content: '你好，我是你的账本小秘。可以帮你查看收支、记账、分析消费结构～' }
    ],
    isLoading: false,
    scrollIntoView: '',
    canScroll: false,
    version: '',
    localVersion: ''
  },
  onShow(){
    this.setData({
      version: app.globalData.env,
      localVersion: app.globalData.localEnv
    })
    this.loadChatHistory()
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },
  
  // 查询历史对话记录
  loadChatHistory() {
    get('/front/chat/list').then(res => {
      const raw = Array.isArray(res.data) ? res.data : [];
      const messages = raw.map((it, idx) => {
        const roleRaw = it.role || it.sender || it.from || '';
        const role = /user/i.test(roleRaw) ? 'user' : 'assistant';
        const content = it.content || it.text || it.message || '';
        const id = it.id || it.msgId || (Date.now() + idx);
        return { id, role, content };
      }).filter(m => m.content && (m.role === 'user' || m.role === 'assistant'));
      const welcome = { id: 'welcome', role: 'assistant', content: '你好，我是你的账本小秘。可以帮你查看收支、记账、分析消费结构～' };
      const needWelcome = !(messages[0] && messages[0].role === 'assistant' && messages[0].content === welcome.content);
      const merged = needWelcome ? [welcome, ...messages] : messages;
      const lastId = (merged[merged.length - 1] && merged[merged.length - 1].id) || 'welcome';
      this.setData({ messages: merged }, () => {
        // 强制延迟滚动，确保渲染完成
        setTimeout(() => {
          this.updateScrollAbility(lastId, true)
        }, 500);
      })
    }).catch(() => {
      // 忽略历史拉取失败，保留默认欢迎语
    });
  },
  
  onSend() {
    const text = (this.data.inputValue || '').trim();
    if (!text || this.data.isLoading) return;
    
    const msgId = Date.now();
    const userMsg = { id: msgId, role: 'user', content: text };
    
    // 添加用户消息，并预置一条空的助手消息用于流式更新
    const assistantMsgId = msgId + 1;
    const assistantMsg = { id: assistantMsgId, role: 'assistant', content: '...' };
    
    this.setData({
      messages: [...this.data.messages, userMsg, assistantMsg],
      inputValue: '',
      isLoading: true,
      scrollIntoView: ''
    }, () => {
      this.updateScrollAbility(assistantMsgId)
    });
    
    this.streamRequest(text, assistantMsgId);
  },

  streamRequest(message, msgId) {
    const that = this;
    const requestTask = wx.request({
      url: `${BASE_URL}/common/ai/chat`,
      method: 'GET',
      data: { message },
      header: {
        'content-type': 'application/json',
        'Authorization': getToken()
      },
      enableChunked: true, // 开启流式传输
      success: (res) => {
        // 请求完成（流式传输结束后也会回调）
        that.setData({ isLoading: false });
      },
      fail: (err) => {
        that.updateMessage(msgId, '网络请求失败，请稍后重试');
        that.setData({ isLoading: false });
      }
    });

    // 监听流式数据
    requestTask.onChunkReceived((response) => {
      const arrayBuffer = response.data;
      const uint8Array = new Uint8Array(arrayBuffer);
      let chunkText = '';
      
      // 兼容处理：尝试使用 TextDecoder (基础库 2.11.0+)
      if (typeof TextDecoder !== 'undefined') {
          const decoder = new TextDecoder('utf-8');
          chunkText = decoder.decode(uint8Array, { stream: true });
      } else {
          // 降级处理：简单转码 (可能存在多字节截断问题)
          // 生产环境建议自行实现或引入 polyfill
          try {
            // 使用 escape 方式解码 UTF-8
            // String.fromCharCode.apply(null, uint8Array) 可能会栈溢出如果 chunk 很大
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i]);
            }
            chunkText = decodeURIComponent(escape(binary));
          } catch (e) {
            console.warn('Decode chunk failed, fallback to raw string', e);
            chunkText = String.fromCharCode(...uint8Array);
          }
      }
      
      // 累加内容并更新 UI
      that.appendMessageContent(msgId, chunkText);
    });
  },

  // 辅助：追加消息内容
  appendMessageContent(id, newContent) {
    // 找到对应消息并追加内容
    const index = this.data.messages.findIndex(m => m.id === id);
    if (index !== -1) {
       const msg = this.data.messages[index];
       const currentContent = msg.content === '...' ? '' : msg.content;
       const updatedContent = currentContent + newContent;
       
       // 使用 setData 的路径更新语法，避免全量更新导致性能问题
       this.setData({
         [`messages[${index}].content`]: updatedContent
       }, () => {
         this.updateScrollAbility(id)
       });
    }
  },
  
  // 辅助：直接更新消息内容（用于报错等）
  updateMessage(id, content) {
    const messages = this.data.messages.map(msg => {
      if (msg.id === id) {
        return { ...msg, content };
      }
      return msg;
    });
    this.setData({ messages });
  },
  
  updateScrollAbility(lastId, forceScroll = false) {
    const query = wx.createSelectorQuery().in(this);
    query.select('.message-list').boundingClientRect();
    query.select('#message-content').boundingClientRect();
    query.select('.input-bar').boundingClientRect();
    query.exec(res => {
      const container = res && res[0];
      const content = res && res[1];
      const inputBar = res && res[2];
      
      if (!container || !content) {
        this.setData({ canScroll: false, scrollIntoView: '' });
        return;
      }
      
      // 视口高度应减去 input-bar 的高度（虽然 flex 布局已经处理了，但为了安全起见检查可视区域）
      // 实际上 container.height 已经是 flex:1 分配后的高度了，所以直接比较 content 与 container 即可
      // 但用户反馈“没占满无需滑动”，可能是因为 content 包含了一些 margin/padding 导致计算误差
      // 我们放宽一点条件，加上一点冗余值
      const canScroll = content.height > container.height + 5; 
      
      if (canScroll) {
        this.setData({ canScroll: true });
        // 如果是强制滚动，或者内容确实超出了
        if (forceScroll) {
           this.setData({ scrollIntoView: `msg-${lastId}` });
        } else {
           // 只有当不是初始化加载时，我们才考虑自动滚到底部（比如流式输出时）
           // 这里我们保持原样，流式输出时调用此方法也会触发滚动
           this.setData({ scrollIntoView: `msg-${lastId}` });
        }
      } else {
        // 如果内容不满一屏，无需滚动，也不需要 scrollIntoView（否则可能会强制置底导致顶部看不见）
        this.setData({ canScroll: false, scrollIntoView: '' });
      }
    });
  }
})
