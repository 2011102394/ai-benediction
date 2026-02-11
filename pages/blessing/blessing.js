/**
 * 祝福语生成页面
 */
const { checkUsage, consumeUsage, addInviteReward, reinitUsageAfterLogin } = require('../../utils/usage.js')
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
    animatingFestival: false,
    animatingRecipient: false,
    generatedBlessing: '',
    loading: false,
    usageInfo: {},
    theme: 'spring',
    styles: {},
    canGenerate: true,
    isLogin: false
  },

  onLoad(options) {
    this.setData({ isLogin: isLoggedIn() })
    this.loadFestivals()
    this.loadRecipients()
    this.checkUserUsage()
    this.getUserOpenId()
    
    // 处理邀请参数
    if (options && options.inviter) {
      this.handleInvite(options.inviter)
    }
  },

  onShow() {
    // 每次显示页面时更新登录状态
    this.setData({ isLogin: isLoggedIn() })
    this.checkUserUsage()
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
      showCustomFestivalInput: isCustom
    })
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
    // 检查是否登录
    if (!isLoggedIn()) {
      wx.showModal({
        title: '需要登录',
        content: '登录后才能添加自定义节日哦！',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.goToLogin()
          }
        }
      })
      return
    }
    this.setData({ showCustomFestivalInput: true, animatingFestival: true })
  },
  hideAddFestivalInput() {
    this.setData({ showCustomFestivalInput: false })
    // 等待动画结束后移除节点
    setTimeout(() => {
      this.setData({ animatingFestival: false, customFestival: '' })
    }, 300)
  },

  // 显示/隐藏自定义对象输入
  showAddRecipientInput() {
    // 检查是否登录
    if (!isLoggedIn()) {
      wx.showModal({
        title: '需要登录',
        content: '登录后才能添加自定义对象哦！',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.goToLogin()
          }
        }
      })
      return
    }
    this.setData({ showCustomRecipientInput: true, animatingRecipient: true })
  },
  hideAddRecipientInput() {
    this.setData({ showCustomRecipientInput: false })
    // 等待动画结束后移除节点
    setTimeout(() => {
      this.setData({ animatingRecipient: false, customRecipient: '' })
    }, 300)
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 什么都不做，只是阻止冒泡
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
      } else if (res.result.code === -2) {
        // 未登录
        wx.showModal({
          title: '需要登录',
          content: res.result.message,
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              this.goToLogin()
            }
          }
        })
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
      } else if (res.result.code === -2) {
        // 未登录
        wx.showModal({
          title: '需要登录',
          content: res.result.message,
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              this.goToLogin()
            }
          }
        })
      } else {
        wx.showToast({ title: res.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 获取农历年份和生肖信息
  getLunarYearInfo(isSpringFestival = false) {
    const ZODIAC_ANIMALS = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊']
    const SPRING_FESTIVAL_DATES = {
      2020: { month: 1, day: 25 }, 2021: { month: 2, day: 12 }, 2022: { month: 2, day: 1 },
      2023: { month: 1, day: 22 }, 2024: { month: 2, day: 10 }, 2025: { month: 1, day: 29 },
      2026: { month: 2, day: 17 }, 2027: { month: 2, day: 6 }, 2028: { month: 1, day: 26 },
      2029: { month: 2, day: 13 }, 2030: { month: 2, day: 3 }
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    
    let springFestival = SPRING_FESTIVAL_DATES[year] || { month: 2, day: 4 }
    
    let lunarYear = year
    let isBeforeSpringFestival = false
    
    if (month < springFestival.month || 
        (month === springFestival.month && day < springFestival.day)) {
      isBeforeSpringFestival = true
    }
    
    if (isSpringFestival) {
      if (isBeforeSpringFestival) {
        lunarYear = year
      } else {
        const currentDate = new Date(year, month - 1, day)
        const sfDate = new Date(year, springFestival.month - 1, springFestival.day)
        const daysDiff = Math.floor((currentDate - sfDate) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 30) {
          lunarYear = year
        } else {
          lunarYear = year + 1
        }
      }
    } else {
      if (isBeforeSpringFestival) {
        lunarYear = year - 1
      }
    }
    
    return {
      lunarYear,
      zodiac: ZODIAC_ANIMALS[lunarYear % 12],
      gregorianDate: `${year}年${month}月${day}日`
    }
  },

  // 构建Prompt
  buildPrompt(festival, festivalName, recipient, recipientName) {
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
1. 你必须在祝福语开头明确使用"${targetYear}年${targetZodiac}年"或"${targetZodiac}年"
2. 整个祝福语中只能出现"${targetZodiac}"这个生肖
3. 绝对不能出现"蛇年"、"龙年"、"兔年"等其他生肖
4. 当前公历日期是${lunarInfo.gregorianDate}，但祝福语要使用${targetYear}年（${targetZodiac}年）
`
      : `【重要要求】
1. 这是一个非春节的节日祝福，不要在祝福语中出现任何生肖年份（如"蛇年"、"龙年"等）
2. 也不要出现"20XX年"这样的公历年份
3. 专注于节日本身的祝福内容
`

    // 添加随机性提示，避免重复
    const randomStyles = [
      '温馨感人',
      '幽默风趣',
      '文艺优雅',
      '简洁有力',
      '传统典雅',
      '亲切自然'
    ]
    const randomStyle = randomStyles[Math.floor(Math.random() * randomStyles.length)]
    const randomSeed = Math.floor(Math.random() * 1000)

    return {
      prompt: `你是一位擅长写节日祝福语的文案专家。请生成一段${zodiacText}${festivalName || festival}祝福语。

【节日】${festivalName || festival}
【祝福对象】${recipientName || recipient}
【风格要求】${randomStyle}（随机种子：${randomSeed}）
${zodiacRequirement}
【内容要求】
1. 祝福语要符合${festivalName || festival}的节日氛围和传统文化
2. 根据对象身份调整语气和用词（对领导要尊敬、对父母要亲切、对朋友要活泼等）
3. 字数控制在50-100字之间
4. 语言优美、情感真挚、朗朗上口，避免使用常见的套话和陈词滥调
5. 可以适当加入emoji增加活泼感
6. 直接输出祝福语，不要解释
7. 每次生成的祝福语要有创意，不要重复之前的内容

请直接输出祝福语：`,
      lunarInfo
    }
  },

  // 使用 wx.cloud.extend.AI 生成祝福语（前端直接调用，使用 AI 小程序成长计划赠送的 Token）
  async generateBlessing() {
    const { selectedFestival, selectedFestivalName, selectedRecipient, selectedRecipientName } = this.data
    
    if (!selectedFestival || !selectedRecipient) {
      wx.showToast({ title: '请选择节日和对象', icon: 'none' })
      return
    }

    // 检查使用次数
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

    this.setData({ loading: true, generatedBlessing: '' })

    try {
      // 构建Prompt
      const { prompt, lunarInfo } = this.buildPrompt(
        selectedFestival,
        selectedFestivalName,
        selectedRecipient,
        selectedRecipientName
      )

      // 调试信息（如需排查问题可取消注释）
      // console.log('生成祝福语:', { festival: selectedFestival, lunarYear: lunarInfo.lunarYear, zodiac: lunarInfo.zodiac })

      // 前端直接调用 wx.cloud.extend.AI（使用 AI 小程序成长计划赠送的免费 Token）
      const model = wx.cloud.extend.AI.createModel('hunyuan-exp')
      const res = await model.streamText({
        data: {
          model: 'hunyuan-turbos-latest',
          messages: [
            { role: 'system', content: '你是一位擅长写节日祝福语的文案专家，生成的祝福语要温馨、得体、富有文采。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 1024
        }
      })

      let blessing = ''
      for await (let event of res.eventStream) {
        if (event.data === '[DONE]') break
        const data = JSON.parse(event.data)
        const text = data?.choices?.[0]?.delta?.content
        if (text) {
          blessing += text
          this.setData({ generatedBlessing: blessing })
        }
      }

      if (blessing) {
        // 扣减次数（优先使用免费次数，其次使用邀请奖励）
        const usageType = usage.type === 'free' ? 'free' : 'invite'
        consumeUsage(usageType)
        this.checkUserUsage()
        // 保存到历史记录
        this.saveToHistory(blessing)
      } else {
        throw new Error('生成内容为空')
      }
    } catch (err) {
      console.error('生成祝福语失败:', err)
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

  // 微信一键登录
  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      const result = await login()

      if (result.success) {
        // 登录后重新初始化使用次数（将游客额度转为登录用户额度）
        reinitUsageAfterLogin()
        // 刷新登录状态
        this.setData({ isLogin: true })
        // 检查使用次数
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
