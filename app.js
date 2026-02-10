// app.js
const { syncFromCloud } = require('./utils/user.js')
const { initUsage } = require('./utils/usage.js')

App({
  globalData: {
    openid: null,
    userType: 'implicit',
    userInfo: null,
    currentTheme: 'spring' // 当前节日主题
  },

  onLaunch: async function () {
    if (!wx.cloud) {
      return
    }

    // 初始化云开发
    wx.cloud.init({
      traceUser: true,
    })

    // 初始化用户系统
    await this.initUserSystem()
  },

  /**
   * 初始化用户系统
   */
  async initUserSystem() {
    try {
      let openid = wx.getStorageSync('openid')
      let userInfo = wx.getStorageSync('userInfo')
      let isLogin = wx.getStorageSync('isLogin')

      if (!openid) {
        try {
          const res = await wx.cloud.callFunction({
            name: 'login'
          })
          openid = res.result.openid
          wx.setStorageSync('openid', openid)
        } catch (err) {
          openid = null
        }
      }

      this.globalData.openid = openid
      this.globalData.userInfo = userInfo
      this.globalData.userType = isLogin ? 'registered' : 'implicit'

      // 初始化每日使用统计
      this.initDailyUsage()
      
      // 如果已登录，从云端同步数据
      if (isLogin && userInfo) {
        await syncFromCloud()
      }
    } catch (err) {
      // 初始化失败，静默处理
    }
  },

  /**
   * 初始化每日使用统计
   */
  initDailyUsage() {
    initUsage()
  },

  /**
   * 设置当前节日主题
   */
  setCurrentTheme(theme) {
    this.globalData.currentTheme = theme
    // 更新导航栏颜色
    const themeConfig = this.getThemeConfig(theme)
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: themeConfig.primaryColor
    })
  },

  /**
   * 获取主题配置
   */
  getThemeConfig(theme) {
    const themes = {
      spring: { primaryColor: '#D32F2F', secondaryColor: '#FFD700', name: '春节' },
      lantern: { primaryColor: '#FF6B6B', secondaryColor: '#FFF8E1', name: '元宵' },
      qingming: { primaryColor: '#4CAF50', secondaryColor: '#E8F5E9', name: '清明' },
      dragon: { primaryColor: '#2E7D32', secondaryColor: '#FF9800', name: '端午' },
      midautumn: { primaryColor: '#FF9800', secondaryColor: '#FFF3E0', name: '中秋' },
      chongyang: { primaryColor: '#795548', secondaryColor: '#D7CCC8', name: '重阳' },
      custom: { primaryColor: '#1976D2', secondaryColor: '#BBDEFB', name: '自定义' }
    }
    return themes[theme] || themes.spring
  }
})
