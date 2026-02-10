/**
 * 奖励邀请人云函数
 * 当新用户通过邀请进入时，给邀请人添加奖励次数
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 每次邀请奖励次数（调整为2次）
const INVITE_REWARD = 2

exports.main = async (event, context) => {
  const { inviterId } = event
  
  if (!inviterId) {
    return { code: -1, message: '缺少邀请人ID' }
  }

  try {
    // 获取今天的日期字符串
    const today = new Date().toDateString()
    
    // 查询邀请人今天的邀请记录
    const inviteRecordRes = await db.collection('invite_records')
      .where({
        inviterId: inviterId,
        date: today
      })
      .get()
    
    // 检查今天是否已经给这个邀请人奖励过（防止重复奖励）
    const existingRecord = inviteRecordRes.data[0]
    
    if (existingRecord) {
      // 今天已经有记录，增加邀请计数
      await db.collection('invite_records').doc(existingRecord._id).update({
        data: {
          inviteCount: _.inc(1),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 今天第一次邀请，创建新记录
      await db.collection('invite_records').add({
        data: {
          inviterId: inviterId,
          date: today,
          inviteCount: 1,
          rewardCount: INVITE_REWARD,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
    
    // 查询或创建邀请人的奖励记录
    const userRewardRes = await db.collection('user_rewards')
      .where({
        openId: inviterId
      })
      .get()
    
    if (userRewardRes.data.length > 0) {
      // 更新奖励次数
      await db.collection('user_rewards').doc(userRewardRes.data[0]._id).update({
        data: {
          inviteReward: _.inc(INVITE_REWARD),
          totalInviteReward: _.inc(INVITE_REWARD),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 创建新的奖励记录
      await db.collection('user_rewards').add({
        data: {
          openId: inviterId,
          inviteReward: INVITE_REWARD,
          totalInviteReward: INVITE_REWARD,
          adReward: 0,
          totalAdReward: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      code: 0,
      message: '奖励成功',
      data: {
        rewardCount: INVITE_REWARD
      }
    }
    
  } catch (err) {
    return {
      code: -1,
      message: '奖励失败: ' + err.message
    }
  }
}
