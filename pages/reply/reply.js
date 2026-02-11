/**
 * 回复语生成页面
 */
const { checkUsage, consumeUsage, addInviteReward, reinitUsageAfterLogin } = require('../../utils/usage.js')
const { isLoggedIn, login } = require('../../utils/user.js')
const { getTheme } = require('../../utils/theme.js')
const { getCurrentYearInfo } = require('../../utils/lunar.js')

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
      selectedFestivalName: name
    })
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

  // 获取农历年份和生肖信息（使用 lunar-javascript 库）
  getLunarYearInfo(isSpringFestival = false) {
    const lunarInfo = getCurrentYearInfo(isSpringFestival)
    const now = new Date()

    return {
      lunarYear: lunarInfo.lunarYear,
      zodiac: lunarInfo.zodiac,
      ganzhiYear: lunarInfo.ganzhiYear,
      gregorianDate: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
      // 额外信息，可用于调试
      daysToSpring: lunarInfo.daysToSpring
    }
  },

  // 构建Prompt
  buildPrompt(festival, festivalName, recipient, recipientName, receivedBlessing) {
    const isSpringFestival = festival === 'spring'
    const lunarInfo = this.getLunarYearInfo(isSpringFestival)
    const targetZodiac = lunarInfo.zodiac
    const targetYear = lunarInfo.lunarYear

    // 只有春节才使用生肖年份，其他节日不使用
    const isShowZodiac = festival === 'spring'
    const zodiacText = isShowZodiac ? `${targetZodiac}年（${targetYear}年）的` : ''
    const zodiacRequirement = isShowZodiac
      ? `【必须使用的生肖】${targetZodiac}年
【必须使用的年份】${targetYear}年

【最重要要求】
1. 你必须在回复语中明确使用"${targetYear}年${targetZodiac}年"或"${targetZodiac}年"
2. 整个回复语中只能出现"${targetZodiac}"这个生肖
3. 绝对不能出现"蛇年"、"龙年"、"兔年"等其他生肖
4. 当前公历日期是${lunarInfo.gregorianDate}，但回复语要使用${targetYear}年（${targetZodiac}年）
`
      : `【重要要求】
1. 这是一个非春节的节日回复，不要在回复语中出现任何生肖年份（如"蛇年"、"龙年"等）
2. 也不要出现"20XX年"这样的公历年份
3. 专注于节日本身的回复内容
`

    // 添加随机性提示，避免重复
    const randomStyles = [
      '真诚感人',
      '幽默风趣',
      '简洁优雅',
      '亲切自然',
      '文艺清新',
      '活泼俏皮'
    ]
    const randomStyle = randomStyles[Math.floor(Math.random() * randomStyles.length)]
    const randomSeed = Math.floor(Math.random() * 1000)

    return {
      prompt: `你是一位懂礼仪的社交达人。请生成一段${zodiacText}${festivalName || festival}祝福回复。

【节日】${festivalName || festival}
【收到祝福语】${receivedBlessing}
【回复对象】${recipientName || recipient}
【风格要求】${randomStyle}（随机种子：${randomSeed}）
${zodiacRequirement}
【内容要求】
1. 回复要真诚感谢对方的祝福
2. 回祝对方${festivalName || festival}快乐
3. 根据对象身份调整语气（对领导要尊敬、对父母要亲切、对朋友要活泼等）
4. 字数控制在30-80字之间
5. 语言得体、情感真挚，避免使用常见的套话和陈词滥调
6. 可以适当加入emoji增加活泼感
7. 直接输出回复语，不要解释
8. 每次生成的回复要有创意，不要重复之前的内容

请直接输出回复语：`,
      lunarInfo
    }
  },

  // 使用 wx.cloud.extend.AI 生成回复语（前端直接调用，使用 AI 小程序成长计划赠送的 Token）
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
      // 页面上已有相应的提示区域，不再弹出 Modal
      wx.showToast({ title: usage.message || '次数已用完', icon: 'none' })
      return
    }

    // 检查是否支持 AI 能力
    if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
      wx.showModal({
        title: '提示',
        content: '当前基础库版本不支持 AI 能力，请升级微信版本后重试',
        showCancel: false
      })
      return
    }

    this.setData({ loading: true, generatedReply: '' })

    try {
      // 构建Prompt
      const { prompt, lunarInfo } = this.buildPrompt(
        selectedFestival,
        selectedFestivalName,
        selectedRecipient,
        selectedRecipientName,
        receivedBlessing
      )

      // 调试信息（如需排查问题可取消注释）
      // console.log('生成回复语:', { festival: selectedFestival, lunarYear: lunarInfo.lunarYear, zodiac: lunarInfo.zodiac })

      // 前端直接调用 wx.cloud.extend.AI（使用 AI 小程序成长计划赠送的免费 Token）
      const model = wx.cloud.extend.AI.createModel('hunyuan-exp')
      const res = await model.streamText({
        data: {
          model: 'hunyuan-turbos-latest',
          messages: [
            { role: 'system', content: '你是一位懂礼仪的社交达人，擅长得体的节日祝福回复。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 1024
        }
      })

      let reply = ''
      for await (let event of res.eventStream) {
        if (event.data === '[DONE]') break
        const data = JSON.parse(event.data)
        const text = data?.choices?.[0]?.delta?.content
        if (text) {
          reply += text
          this.setData({ generatedReply: reply })
        }
      }

      if (reply) {
        // 扣减次数（优先使用免费次数，其次使用邀请奖励）
        const usageType = usage.type === 'free' ? 'free' : 'invite'
        consumeUsage(usageType)
        this.checkUserUsage()
        this.saveToHistory(reply)
      } else {
        throw new Error('生成内容为空')
      }
    } catch (err) {
      console.error('生成回复语失败:', err)
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

  // 微信一键登录
  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      const result = await login()

      if (result.success) {
        // 登录后重新初始化使用次数（将游客额度转为登录用户额度）
        reinitUsageAfterLogin()
        // 刷新登录状态和使用次数
        this.checkUserUsage()
        // 显示成功提示
        wx.showToast({ title: '登录成功', icon: 'success' })
        // 检查是否有待处理的邀请
        this.checkPendingInvite()
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
      // 给被邀请人添加奖励
      const newCount = addInviteReward(2)
      
      wx.showModal({
        title: '获得邀请奖励',
        content: '你通过好友邀请进入，已获得2次额外生成机会！',
        showCancel: false,
        success: () => {
          this.checkUserUsage()
        }
      })
      
      // 清除待处理标记
      wx.removeStorageSync('pending_inviter')
      
      // 调用云函数给邀请人添加奖励
      wx.cloud.callFunction({
        name: 'rewardInviter',
        data: { inviterId: pendingInviter }
      }).catch(() => {})
    }
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
