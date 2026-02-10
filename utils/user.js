/**
 * 用户管理工具
 * 
 * 登录方式：wx.getUserProfile 获取头像昵称
 * 登录后次数沿用未登录时的剩余次数
 */

// 登录用户每日免费次数
const LOGIN_FREE_COUNT = 10
// 未登录用户每日免费次数
const GUEST_FREE_COUNT = 5

/**
 * 检查用户登录状态
 */
function isLoggedIn() {
  const userInfo = wx.getStorageSync('userInfo')
  const isLogin = wx.getStorageSync('isLogin')
  return !!(userInfo && isLogin)
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return wx.getStorageSync('userInfo') || null
}

/**
 * 获取 OpenID
 */
function getOpenId() {
  return wx.getStorageSync('openid') || null
}

/**
 * 获取当前用户的免费次数上限
 */
function getMaxFreeCount() {
  return isLoggedIn() ? LOGIN_FREE_COUNT : GUEST_FREE_COUNT
}

/**
 * 用户登录
 * 获取用户信息并同步数据到云端
 */
function login() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (res) => {
        const userInfo = res.userInfo
        
        try {
          // 保存用户信息到本地
          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('isLogin', true)
          
          // 更新全局数据
          const app = getApp()
          if (app) {
            app.globalData.userInfo = userInfo
            app.globalData.userType = 'registered'
          }
          
          // 同步到云端
          await syncUserToCloud(userInfo)
          
          resolve({ success: true, userInfo })
        } catch (err) {
          reject(err)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 同步用户数据到云端
 * 登录时将本地数据同步到云数据库
 */
async function syncUserToCloud(userInfo) {
  const openid = getOpenId()
  if (!openid) {
    return
  }

  try {
    // 获取当前本地次数
    const freeCount = wx.getStorageSync('free_count') || 0
    const inviteCount = wx.getStorageSync('invite_count') || 0
    const today = new Date().toDateString()

    // 调用云函数同步
    const res = await wx.cloud.callFunction({
      name: 'syncUserUsage',
      data: {
        userInfo: userInfo,
        freeCount: freeCount,
        inviteCount: inviteCount,
        lastInitDate: today
      }
    })

  } catch (err) {
    // 同步失败，静默处理
  }
}

/**
 * 从云端同步用户数据到本地
 * 用于多设备登录时恢复数据
 */
async function syncFromCloud() {
  if (!isLoggedIn()) return

  try {
    const res = await wx.cloud.callFunction({
      name: 'getUserUsage'
    })

    if (res.result.code === 0 && res.result.data) {
      const data = res.result.data
      const today = new Date().toDateString()

      // 检查是否是新的一天
      if (data.lastInitDate === today) {
        // 同一天，恢复云端次数（取较大值，防止本地已使用）
        const localFree = wx.getStorageSync('free_count') || 0
        const cloudFree = data.freeCount || 0
        wx.setStorageSync('free_count', Math.max(localFree, cloudFree))
        
        // 邀请次数以云端为准（云端是累计值）
        wx.setStorageSync('invite_count', data.inviteCount || 0)
      } else {
        // 新的一天，重置免费次数
        wx.setStorageSync('free_count', LOGIN_FREE_COUNT)
        wx.setStorageSync('usage_init_date', today)
        // 邀请次数继承
        wx.setStorageSync('invite_count', data.inviteCount || 0)
      }

      console.log('[User] 已从云端同步用户数据')
    }
  } catch (err) {
    console.error('[User] 从云端同步失败:', err)
  }
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('userInfo')
  wx.removeStorageSync('isLogin')
  
  const app = getApp()
  if (app) {
    app.globalData.userInfo = null
    app.globalData.userType = 'implicit'
  }
}

/**
 * 获取用户统计信息
 */
function getUserStats() {
  const userInfo = getUserInfo()
  const isLogin = isLoggedIn()
  
  return {
    isLogin,
    userInfo,
    maxFreeCount: getMaxFreeCount(),
    canInvite: isLogin // 只有登录用户才能邀请
  }
}

module.exports = {
  isLoggedIn,
  getUserInfo,
  getOpenId,
  getMaxFreeCount,
  login,
  logout,
  syncFromCloud,
  syncUserToCloud,
  getUserStats,
  LOGIN_FREE_COUNT,
  GUEST_FREE_COUNT
}
