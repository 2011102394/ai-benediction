/**
 * 获取用户使用次数（从云端）
 * 用于多设备同步或恢复数据
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: -1, message: '未获取到用户标识' }
  }

  try {
    const userRes = await db.collection('users')
      .where({ _openid: openid })
      .get()

    if (userRes.data.length > 0) {
      const userData = userRes.data[0]
      return {
        code: 0,
        message: '获取成功',
        data: {
          freeCount: userData.freeCount || 0,
          inviteCount: userData.inviteCount || 0,
          lastInitDate: userData.lastInitDate || '',
          totalInvited: userData.totalInvited || 0,
          totalUsed: userData.totalUsed || 0,
          userInfo: {
            nickName: userData.nickName || '',
            avatarUrl: userData.avatarUrl || ''
          }
        }
      }
    } else {
      return {
        code: -2,
        message: '用户数据不存在'
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: '获取失败: ' + err.message
    }
  }
}
