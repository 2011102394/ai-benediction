/**
 * 祝福语生成页面
 */
const { checkUsage, consumeUsage, addInviteReward } = require('../../utils/usage.js')
const { isLoggedIn, login } = require('../../utils/user.js')
const { getTheme } = require('../../utils/theme.js')

Page({
  data: {
    festivals: [],
    recipients: [],
    selectedFestival: '',
    selectedFestivalName: '',
    selectedRecipient: '',
    selectedRecipientName: '',
    customFestival: '',
    customRecipient: '',
    showCustomFestivalInput: false,
    showCustomRecipientInput: false,
    generatedBlessing: '',
    loading: false,
    usageInfo: {},
    theme: 'spring',
    styles: {},
    canGenerate: true
  },

  onLoad(options) {
    this.loadFestivals()
    this.loadRecipients()
    this.checkUserUsage()
    this.getUserOpenId()
    
    // 处理邀请参数
    if (options && options.inviter) {
      this.handleInvite(options.inviter)
    }
  },

  // 获取用户OpenID
  async getUserOpenId() {
    try {
      const { result } = await wx.cloud.callFunction({ name: 'login' })
      if (result && result.openid) {
        this.setData({ userOpenId: result.openid })
      }
    } catch (err) {
      // 获取OpenID失败，静默处理
    }
  },

  // 分享给朋友（带邀请参数）
  onShareAppMessage() {
    const openId = this.data.userOpenId
    return {
      title: 'AI智能祝福语生成器，节日祝福不用愁！',
      path: openId ? `/pages/blessing/blessing?inviter=${openId}` : '/pages/blessing/blessing',
      imageUrl: '/images/share-cover.png' // 可选：自定义分享图片
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const openId = this.data.userOpenId
    return {
      title: 'AI智能祝福语生成器',
      query: openId ? `inviter=${openId}` : '',
      imageUrl: '/images/share-cover.png'
    }
  },

  onShow() {
    this.checkUserUsage()
  },

  // 加载节日列表
  async loadFestivals() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getFestivals'
      })
      
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
      // 使用默认数据，不提示错误
    }
  },

  // 加载祝福对象列表
  async loadRecipients() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getRecipients'
      })
      
      if (res.result && res.result.code === 0 && res.result.data && res.result.data.recipients.length > 0) {
        this.setData({ recipients: res.result.data.recipients })
      }
    } catch (err) {
      // 使用默认数据，不提示错误
    }
  },

  // 检查使用次数
  checkUserUsage() {
    const usage = checkUsage()
    this.setData({
      usageInfo: usage,
      canGenerate: usage.canUse
    })
  },

  // 选择节日
  selectFestival(e) {
    const { id, name, theme } = e.currentTarget.dataset
    const isCustom = id === 'custom'
    
    this.setData({
      selectedFestival: id,
      selectedFestivalName: name,
      showCustomFestivalInput: isCustom,
      theme: theme || 'spring',
      styles: getTheme(theme || 'spring')
    })

    // 更新导航栏颜色
    const app = getApp()
    app.setCurrentTheme(theme || 'spring')
  },

  // 选择祝福对象
  selectRecipient(e) {
    const { id, name } = e.currentTarget.dataset
    const isCustom = id === 'custom'
    
    this.setData({
      selectedRecipient: id,
      selectedRecipientName: name,
      showCustomRecipientInput: isCustom
    })
  },

  // 显示/隐藏自定义节日输入
  showAddFestivalInput() {
    this.setData({ showCustomFestivalInput: true })
  },
  hideAddFestivalInput() {
    this.setData({ showCustomFestivalInput: false, customFestival: '' })
  },

  // 显示/隐藏自定义对象输入
  showAddRecipientInput() {
    this.setData({ showCustomRecipientInput: true })
  },
  hideAddRecipientInput() {
    this.setData({ showCustomRecipientInput: false, customRecipient: '' })
  },

  // 自定义节日输入
  onCustomFestivalInput(e) {
    this.setData({ customFestival: e.detail.value })
  },

  // 自定义对象输入
  onCustomRecipientInput(e) {
    this.setData({ customRecipient: e.detail.value })
  },

  // 添加自定义节日
  async addCustomFestival() {
    const name = this.data.customFestival.trim()
    if (!name) {
      wx.showToast({ title: '请输入节日名称', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '保存中...' })
      const res = await wx.cloud.callFunction({
        name: 'saveCustomFestival',
        data: { name, theme: 'custom' }
      })
      
      if (res.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.setData({
          customFestival: '',
          showCustomFestivalInput: false
        })
        this.loadFestivals()
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 添加自定义对象
  async addCustomRecipient() {
    const name = this.data.customRecipient.trim()
    if (!name) {
      wx.showToast({ title: '请输入对象名称', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '保存中...' })
      const res = await wx.cloud.callFunction({
        name: 'saveCustomRecipient',
        data: { name }
      })
      
      if (res.result.code === 0) {
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.setData({
          customRecipient: '',
          showCustomRecipientInput: false
        })
        this.loadRecipients()
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 生成祝福语
  async generateBlessing() {
    const { selectedFestival, selectedFestivalName, selectedRecipient, selectedRecipientName } = this.data
    
    if (!selectedFestival || !selectedRecipient) {
      wx.showToast({ title: '请选择节日和对象', icon: 'none' })
      return
    }

    // 检查使用次数
    const usage = checkUsage()
    if (!usage.canUse) {
      if (usage.type === 'need_login') {
        // 未登录用户提示登录
        this.showLoginDialog()
      } else if (usage.type === 'need_invite') {
        // 登录用户提示邀请好友
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

    this.setData({ loading: true, generatedBlessing: '' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'generateBlessing',
        data: {
          festival: selectedFestival,
          festivalName: selectedFestivalName,
          recipient: selectedRecipient,
          recipientName: selectedRecipientName
        }
      })

      if (res.result.code === 0) {
        this.setData({ generatedBlessing: res.result.data })
        // 扣减次数（优先使用免费次数，其次使用邀请奖励）
        const usageType = usage.type === 'free' ? 'free' : 'invite'
        consumeUsage(usageType)
        this.checkUserUsage()
        // 保存到历史记录
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
  async saveToHistory(blessing) {
    try {
      await wx.cloud.callFunction({
        name: 'saveHistory',
        data: {
          type: 'blessing',
          festival: this.data.selectedFestivalName,
          recipient: this.data.selectedRecipientName,
          content: blessing
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

  // 处理邀请回调（被邀请人进入时）
  handleInvite(inviterId) {
    if (!inviterId) return
    
    // 只有登录用户才能接受邀请奖励
    if (!isLoggedIn()) {
      // 保存邀请人ID，登录后再处理
      wx.setStorageSync('pending_inviter', inviterId)
      return
    }
    
    // 检查今天是否已经处理过邀请
    const today = new Date().toDateString()
    const lastInviteDate = wx.getStorageSync('last_invite_date')
    const processedInviters = wx.getStorageSync('processed_inviters') || []
    
    if (lastInviteDate === today && processedInviters.includes(inviterId)) {
      return // 今天已经处理过这个邀请人的邀请
    }
    
    // 给被邀请人添加奖励（每次2次）
    const newCount = addInviteReward(2)
    
    // 记录已处理
    processedInviters.push(inviterId)
    wx.setStorageSync('processed_inviters', processedInviters)
    wx.setStorageSync('last_invite_date', today)
    
    wx.showModal({
      title: '欢迎新朋友！',
      content: `你通过好友邀请进入，已获得2次额外生成机会！`,
      showCancel: false,
      success: () => {
        this.checkUserUsage()
      }
    })
    
    // 调用云函数给邀请人也添加奖励
    this.rewardInviter(inviterId)
  },

  // 奖励邀请人
  async rewardInviter(inviterId) {
    try {
      await wx.cloud.callFunction({
        name: 'rewardInviter',
        data: { inviterId }
      })
    } catch (err) {
      // 奖励邀请人失败，静默处理
    }
  },

  /* 广告相关代码（流量主开通后启用）
  // 显示广告弹窗
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

  // 观看激励视频
  watchAd() {
    if (wx.createRewardedVideoAd) {
      const rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-xxx' })
      
      rewardedVideoAd.onLoad(() => console.log('广告加载成功'))
      rewardedVideoAd.onError((err) => {
        console.error('广告加载失败', err)
        wx.showToast({ title: '广告加载失败', icon: 'none' })
      })
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

  // 复制祝福语
  copyBlessing() {
    wx.setClipboardData({
      data: this.data.generatedBlessing,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  }
})
