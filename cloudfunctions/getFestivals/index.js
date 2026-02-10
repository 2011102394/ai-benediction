/**
 * 获取节日列表（从数据库读取预设 + 用户自定义）
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 1. 从数据库查询预设节日
    let presetFestivals = []
    try {
      const presetRes = await db.collection('festivals')
        .where({ type: 'preset' })
        .orderBy('sort', 'asc')
        .get()
      presetFestivals = presetRes.data || []
    } catch (err) {
      // 查询失败，使用空数组
    }

    // 2. 查询用户自定义节日
    let customFestivals = []
    try {
      const userRecord = await db.collection('user_custom_festivals')
        .where({ _openid: openid })
        .get()

      if (userRecord.data.length > 0 && userRecord.data[0].festivals) {
        customFestivals = userRecord.data[0].festivals.map(item => ({
          ...item,
          type: 'user_custom'
        }))
      }
    } catch (err) {
      // 查询失败，使用空数组
    }

    // 3. 合并数据
    const allFestivals = [...presetFestivals, ...customFestivals]

    return {
      code: 0,
      data: {
        festivals: allFestivals,
        preset: presetFestivals,
        custom: customFestivals
      },
      message: 'success'
    }
  } catch (err) {
    return {
      code: -1,
      data: { festivals: [], preset: [], custom: [] },
      message: err.message || '获取节日列表失败'
    }
  }
}
