/**
 * 个人中心页面
 */
const { isLoggedIn, getUserInfo, login, logout, getUserStats } = require('../../utils/user.js')
const { getUsageStats, resetUsage } = require('../../utils/usage.js')

Page({
  data: {
    isLogin: false,
    userInfo: null,
    usageStats: {},
    showLoginButton: true,
    needEditProfile: false
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const loggedIn = isLoggedIn()
    const userInfo = getUserInfo()
    const usageStats = getUsageStats()

    // 判断是否显示完善资料提示（已登录但头像未设置）
    // 昵称可以是任意字符串，包括"null"
    const needEdit = loggedIn && userInfo && 
      (!userInfo.avatarUrl || userInfo.avatarUrl.includes('132'))

    this.setData({
      isLogin: loggedIn,
      userInfo: userInfo,
      usageStats: usageStats,
      showLoginButton: !loggedIn,
      needEditProfile: needEdit
    })
  },

  // 跳转到个人信息编辑页
  goToEditProfile() {
    if (!this.data.isLogin) return
    wx.navigateTo({
      url: '/pages/profileEdit/profileEdit'
    })
  },

  // 用户登录
  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      const result = await login()
      
      if (result.success) {
        // 先刷新界面数据
        this.checkLoginStatus()
        // 检查是否有待处理的邀请
        this.checkPendingInvite()
        // 显示成功提示
        wx.showToast({ title: '登录成功', icon: 'success' })
      }
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 检查待处理的邀请
  checkPendingInvite() {
    const pendingInviter = wx.getStorageSync('pending_inviter')
    if (pendingInviter) {
      // 触发邀请奖励逻辑
      const { addInviteReward } = require('../../utils/usage.js')
      const newCount = addInviteReward(2)
      
      wx.showModal({
        title: '获得邀请奖励',
        content: `你通过好友邀请进入，已获得2次额外生成机会！`,
        showCancel: false
      })
      
      // 清除待处理邀请
      wx.removeStorageSync('pending_inviter')
      
      // 更新界面
      this.checkLoginStatus()
    }
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后将只能使用每日5次免费机会，且邀请奖励不再累积',
      success: (res) => {
        if (res.confirm) {
          logout()
          this.checkLoginStatus()
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  },

  // 邀请好友
  inviteFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showModal({
      title: '邀请好友',
      content: '点击右上角「...」选择「转发给朋友」，好友通过你的分享进入小程序后，双方均可获得2次额外机会！',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const app = getApp()
    const openId = app.globalData.openid
    return {
      title: 'AI智能祝福语生成器，节日祝福不用愁！',
      path: openId ? `/pages/blessing/blessing?inviter=${openId}` : '/pages/blessing/blessing',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const app = getApp()
    const openId = app.globalData.openid
    return {
      title: 'AI智能祝福语生成器',
      query: openId ? `inviter=${openId}` : '',
      imageUrl: '/images/share-cover.png'
    }
  },

  // 重置次数（调试用）
  handleReset() {
    wx.showModal({
      title: '重置次数',
      content: '确定要重置所有使用次数吗？（调试用）',
      success: (res) => {
        if (res.confirm) {
          resetUsage()
          this.checkLoginStatus()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  // 跳转到祝福语页面
  goToBlessing() {
    wx.switchTab({
      url: '/pages/blessing/blessing'
    })
  },

  // 跳转到历史记录页面
  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  }
})
