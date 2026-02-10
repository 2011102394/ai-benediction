/**
 * 同步用户使用次数到云端
 * 用户登录或次数变动时调用
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { userInfo, freeCount, inviteCount, lastInitDate } = event

  if (!openid) {
    return { code: -1, message: '未获取到用户标识' }
  }

  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users')
      .where({ _openid: openid })
      .get()

    const now = db.serverDate()

    if (userRes.data.length > 0) {
      // 更新现有用户数据
      const updateData = {
        updateTime: now
      }

      // 如果有用户信息，更新用户信息
      if (userInfo) {
        updateData.nickName = userInfo.nickName
        updateData.avatarUrl = userInfo.avatarUrl
        updateData.gender = userInfo.gender
        updateData.isLogin = true
      }

      // 更新次数数据（如果传入）
      if (freeCount !== undefined) {
        updateData.freeCount = freeCount
      }
      if (inviteCount !== undefined) {
        updateData.inviteCount = inviteCount
      }
      if (lastInitDate) {
        updateData.lastInitDate = lastInitDate
      }

      await db.collection('users').doc(userRes.data[0]._id).update({
        data: updateData
      })

    } else {
      // 创建新用户记录
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: userInfo ? userInfo.nickName : '',
          avatarUrl: userInfo ? userInfo.avatarUrl : '',
          gender: userInfo ? userInfo.gender : 0,
          isLogin: !!userInfo,
          freeCount: freeCount !== undefined ? freeCount : 10,
          inviteCount: inviteCount !== undefined ? inviteCount : 0,
          totalInvited: 0,
          totalUsed: 0,
          lastInitDate: lastInitDate || new Date().toDateString(),
          createTime: now,
          updateTime: now
        }
      })

    }

    return {
      code: 0,
      message: '同步成功'
    }
  } catch (err) {
    return {
      code: -1,
      message: '同步失败: ' + err.message
    }
  }
}
