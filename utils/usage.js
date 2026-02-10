/**
 * 使用次数控制工具（重构版）
 * 
 * 规则：
 * - 未登录用户：每天5次免费机会，不能邀请
 * - 登录用户：每天10次免费机会，可以邀请（每次邀请+2次，永久有效）
 * 
 * 注意：广告相关代码已注释，开通流量主后可启用
 */

const { isLoggedIn, getMaxFreeCount, LOGIN_FREE_COUNT, GUEST_FREE_COUNT } = require('./user.js')

// 每次邀请奖励次数
const INVITE_REWARD = 2

/**
 * 初始化使用次数
 * 每日首次打开时重置免费次数
 */
function initUsage() {
  const today = new Date().toDateString()
  const lastInitDate = wx.getStorageSync('usage_init_date')
  
  if (lastInitDate !== today) {
    // 新的一天，根据登录状态重置免费次数
    const maxCount = getMaxFreeCount()
    wx.setStorageSync('free_count', maxCount)
    wx.setStorageSync('usage_init_date', today)
  }
  
  // 确保免费次数有值
  const freeCount = wx.getStorageSync('free_count')
  if (freeCount === undefined || freeCount === null || freeCount === '') {
    wx.setStorageSync('free_count', getMaxFreeCount())
  }
}

/**
 * 检查使用次数状态
 */
function checkUsage() {
  initUsage()
  
  const loggedIn = isLoggedIn()
  const freeCount = wx.getStorageSync('free_count') || 0
  const inviteCount = wx.getStorageSync('invite_count') || 0
  const maxCount = getMaxFreeCount()

  // 优先使用免费次数
  if (freeCount > 0) {
    return {
      canUse: true,
      type: 'free',
      remaining: freeCount,
      inviteRemaining: inviteCount,
      maxFree: maxCount,
      isLogin: loggedIn,
      message: `今日可用免费${freeCount}次`
    }
  }
  
  // 登录用户其次使用邀请奖励次数
  if (loggedIn && inviteCount > 0) {
    return {
      canUse: true,
      type: 'invite',
      remaining: inviteCount,
      inviteRemaining: inviteCount,
      maxFree: maxCount,
      isLogin: true,
      message: `使用邀请奖励次数（剩余${inviteCount}次）`
    }
  }

  // 所有次数已用完
  if (loggedIn) {
    // 登录用户提示邀请好友
    return {
      canUse: false,
      type: 'need_invite',
      remaining: 0,
      inviteRemaining: inviteCount,
      maxFree: maxCount,
      isLogin: true,
      message: '今日次数已用完，邀请好友可获得额外次数'
    }
  } else {
    // 未登录用户提示登录
    return {
      canUse: false,
      type: 'need_login',
      remaining: 0,
      inviteRemaining: 0,
      maxFree: GUEST_FREE_COUNT,
      isLogin: false,
      message: '免费次数已用完，登录后可获取更多次数'
    }
  }
}

/**
 * 消耗使用次数
 * @param {string} type - 'free' | 'invite'
 */
function consumeUsage(type = 'free') {
  if (type === 'free') {
    let count = wx.getStorageSync('free_count') || 0
    if (count > 0) {
      wx.setStorageSync('free_count', count - 1)
      // 登录用户同步到云端
      if (isLoggedIn()) {
        syncUsageToCloud()
      }
      return true
    }
    return false
  } else if (type === 'invite') {
    let count = wx.getStorageSync('invite_count') || 0
    if (count > 0) {
      wx.setStorageSync('invite_count', count - 1)
      // 登录用户同步到云端
      if (isLoggedIn()) {
        syncUsageToCloud()
      }
      return true
    }
    return false
  }
  return false
}

/**
 * 添加邀请奖励次数
 * @param {number} count - 奖励次数，默认2次
 */
function addInviteReward(count = INVITE_REWARD) {
  // 只有登录用户才能添加邀请奖励
  if (!isLoggedIn()) {
    return false
  }
  
  let current = wx.getStorageSync('invite_count') || 0
  wx.setStorageSync('invite_count', current + count)
  
  // 同步到云端
  syncUsageToCloud()
  
  return current + count
}

/**
 * 同步使用次数到云端
 */
async function syncUsageToCloud() {
  try {
    await wx.cloud.callFunction({
      name: 'syncUserUsage',
      data: {
        freeCount: wx.getStorageSync('free_count') || 0,
        inviteCount: wx.getStorageSync('invite_count') || 0,
        lastInitDate: wx.getStorageSync('usage_init_date')
      }
    })
  } catch (err) {
    // 同步失败，静默处理
  }
}

/**
 * 获取邀请奖励次数
 */
function getInviteCount() {
  return wx.getStorageSync('invite_count') || 0
}

/**
 * 获取距离下次重置的时间
 */
function getRemainingTime() {
  const today = new Date().toDateString()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const remaining = tomorrow - Date.now()

  if (remaining <= 0) return '即将重置'

  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

  return hours > 0 ? `${hours}小时${minutes}分钟后重置` : `${minutes}分钟后重置`
}

/**
 * 获取使用统计
 */
function getUsageStats() {
  initUsage()
  const loggedIn = isLoggedIn()
  const maxFree = getMaxFreeCount()
  const freeCount = wx.getStorageSync('free_count') || 0
  const inviteCount = wx.getStorageSync('invite_count') || 0
  
  const freeUsed = maxFree - freeCount
  const totalRemaining = freeCount + inviteCount

  return {
    isLogin: loggedIn,
    maxFree: maxFree,
    freeRemaining: freeCount,
    freeUsed: freeUsed,
    inviteRemaining: inviteCount,
    totalUsed: freeUsed,
    totalRemaining: totalRemaining,
    remainingTime: getRemainingTime(),
    canInvite: loggedIn
  }
}

/**
 * 重置所有使用次数（调试用）
 */
function resetUsage() {
  wx.setStorageSync('free_count', getMaxFreeCount())
  wx.setStorageSync('invite_count', 0)
  wx.setStorageSync('usage_init_date', new Date().toDateString())
}

module.exports = {
  initUsage,
  checkUsage,
  consumeUsage,
  addInviteReward,
  getInviteCount,
  getRemainingTime,
  getUsageStats,
  resetUsage,
  LOGIN_FREE_COUNT,
  GUEST_FREE_COUNT,
  INVITE_REWARD
}
