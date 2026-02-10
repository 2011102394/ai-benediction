/**
 * 获取祝福对象列表（从数据库读取预设 + 用户自定义）
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 1. 从数据库查询预设对象
    let presetRecipients = []
    try {
      const presetRes = await db.collection('recipients')
        .where({ type: 'preset' })
        .orderBy('sort', 'asc')
        .get()
      presetRecipients = presetRes.data || []
    } catch (err) {
      // 查询失败，使用空数组
    }

    // 2. 查询用户自定义对象
    let customRecipients = []
    try {
      const userRecord = await db.collection('user_custom_recipients')
        .where({ _openid: openid })
        .get()

      if (userRecord.data.length > 0 && userRecord.data[0].recipients) {
        customRecipients = userRecord.data[0].recipients.map(item => ({
          ...item,
          type: 'user_custom'
        }))
      }
    } catch (err) {
      // 查询失败，使用空数组
    }

    // 3. 合并数据
    const allRecipients = [...presetRecipients, ...customRecipients]

    return {
      code: 0,
      data: {
        recipients: allRecipients,
        preset: presetRecipients,
        custom: customRecipients
      },
      message: 'success'
    }
  } catch (err) {
    return {
      code: -1,
      data: { recipients: [], preset: [], custom: [] },
      message: err.message || '获取祝福对象列表失败'
    }
  }
}
