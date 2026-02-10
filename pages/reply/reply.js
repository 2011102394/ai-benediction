/**
 * 回复语生成页面
 */
const { checkUsage, consumeUsage, addInviteReward } = require('../../utils/usage.js')
const { isLoggedIn } = require('../../utils/user.js')
const { getTheme } = require('../../utils/theme.js')

Page({
  data: {
    festivals: [],
    recipients: [],
    selectedFestival: '',
    selectedFestivalName: '',
    selectedRecipient: '',
    selectedRecipientName: '',
    receivedBlessing: '',
    generatedReply: '',
    loading: false,
    usageInfo: {},
    theme: 'spring',
    styles: {},
    canGenerate: true
  },

  onLoad() {
    this.loadFestivals()
    this.loadRecipients()
    this.checkUserUsage()
  },

  onShow() {
    this.checkUserUsage()
  },

  // 加载节日列表
  async loadFestivals() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getFestivals' })
      if (res.result && res.result.code === 0 && res.result.data && res.result.data.festivals.length > 0) {
        this.setData({ festivals: res.result.data.festivals })
      }
      // 默认选中第一个
      const festivals = this.data.festivals
      if (festivals.length > 0 && !this.data.selectedFestival) {
        const first = festivals[0]
        this.setData({
          selectedFestival: first.id,
          selectedFestivalName: first.name,
          theme: first.theme || 'spring',
          styles: getTheme(first.theme || 'spring')
        })
      }
    } catch (err) {
      // 使用默认数据
    }
  },

  // 加载祝福对象列表
  async loadRecipients() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getRecipients' })
      if (res.result && res.result.code === 0 && res.result.data && res.result.data.recipients.length > 0) {
        this.setData({ recipients: res.result.data.recipients })
      }
    } catch (err) {
      // 使用默认数据
    }
  },

  checkUserUsage() {
    const usage = checkUsage()
    this.setData({
      usageInfo: usage,
      canGenerate: usage.canUse
    })
  },

  selectFestival(e) {
    const { id, name, theme } = e.currentTarget.dataset
    this.setData({
      selectedFestival: id,
      selectedFestivalName: name,
      theme: theme || 'spring',
      styles: getTheme(theme || 'spring')
    })
    const app = getApp()
    app.setCurrentTheme(theme || 'spring')
  },

  selectRecipient(e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({
      selectedRecipient: id,
      selectedRecipientName: name
    })
  },

  onReceivedBlessingInput(e) {
    this.setData({ receivedBlessing: e.detail.value })
  },

  // 生成回复语
  async generateReply() {
    const { selectedFestival, selectedFestivalName, selectedRecipient, selectedRecipientName, receivedBlessing } = this.data
    
    if (!selectedFestival || !selectedRecipient) {
      wx.showToast({ title: '请选择节日和对象', icon: 'none' })
      return
    }

    if (!receivedBlessing.trim()) {
      wx.showToast({ title: '请输入收到的祝福语', icon: 'none' })
      return
    }

    const usage = checkUsage()
    if (!usage.canUse) {
      if (usage.type === 'need_login') {
        this.showLoginDialog()
      } else if (usage.type === 'need_invite') {
        this.showInviteDialog()
      }
      /* 广告相关代码（流量主开通后启用）
      else if (usage.type === 'need_ad') {
        this.showAdDialog()
      }
      */
      else {
        wx.showToast({ title: usage.message, icon: 'none' })
      }
      return
    }

    this.setData({ loading: true, generatedReply: '' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'generateReply',
        data: {
          festival: selectedFestival,
          festivalName: selectedFestivalName,
          recipient: selectedRecipient,
          recipientName: selectedRecipientName,
          receivedBlessing: receivedBlessing
        }
      })

      if (res.result.code === 0) {
        this.setData({ generatedReply: res.result.data })
        // 扣减次数（优先使用免费次数，其次使用邀请奖励）
        const usageType = usage.type === 'free' ? 'free' : 'invite'
        consumeUsage(usageType)
        this.checkUserUsage()
        this.saveToHistory(res.result.data)
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 保存到历史记录（云端）
  async saveToHistory(reply) {
    try {
      await wx.cloud.callFunction({
        name: 'saveHistory',
        data: {
          type: 'reply',
          festival: this.data.selectedFestivalName,
          recipient: this.data.selectedRecipientName,
          content: reply
        }
      })
    } catch (err) {
      // 失败时不提示用户，静默处理
    }
  },

  // 显示登录引导弹窗
  showLoginDialog() {
    wx.showModal({
      title: '免费次数已用完',
      content: '登录后每天可享10次免费机会，还能通过邀请好友获取更多次数！',
      confirmText: '立即登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.goToLogin()
        }
      }
    })
  },

  // 跳转到登录/个人中心
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  // 显示邀请好友弹窗
  showInviteDialog() {
    wx.showModal({
      title: '今日次数已用完',
      content: '邀请好友使用小程序，每邀请一人可获得2次额外机会（永久有效）！',
      confirmText: '立即邀请',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.inviteFriend()
        }
      }
    })
  },

  // 邀请好友
  inviteFriend() {
    // 只有登录用户才能邀请
    if (!isLoggedIn()) {
      wx.showModal({
        title: '需要登录',
        content: '登录后才能邀请好友获取奖励哦！',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.goToLogin()
          }
        }
      })
      return
    }
    
    wx.showModal({
      title: '邀请好友',
      content: '点击右上角「...」选择「转发给朋友」，好友通过你的分享进入小程序后，双方均可获得2次额外机会！',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /* 广告相关代码（流量主开通后启用）
  showAdDialog() {
    wx.showModal({
      title: '免费次数已用完',
      content: '观看短视频可获得额外使用次数，是否观看？',
      confirmText: '观看视频',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.watchAd()
        }
      }
    })
  },

  watchAd() {
    if (wx.createRewardedVideoAd) {
      const rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-xxx' })
      rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          consumeUsage('ad')
          this.checkUserUsage()
          wx.showToast({ title: '获得额外次数', icon: 'success' })
        }
      })
      rewardedVideoAd.show().catch(() => {
        rewardedVideoAd.load().then(() => rewardedVideoAd.show())
      })
    }
  },
  */

  copyReply() {
    wx.setClipboardData({
      data: this.data.generatedReply,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  onShareAppMessage() {
    const pages = getCurrentPages()
    const app = getApp()
    const openId = app.globalData && app.globalData.openId
    return {
      title: '智能回复祝福语',
      path: openId ? `/pages/reply/reply?inviter=${openId}` : '/pages/reply/reply'
    }
  }
})
