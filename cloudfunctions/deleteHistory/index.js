/**
 * 删除单条历史记录
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { id } = event

  if (!openid) {
    return { code: -1, message: '未获取到用户标识' }
  }

  if (!id) {
    return { code: -1, message: '缺少记录ID' }
  }

  try {
    // 先查询确认记录属于当前用户
    const record = await db.collection('history').doc(id).get()

    if (!record.data || record.data._openid !== openid) {
      return { code: -1, message: '无权删除该记录' }
    }

    // 删除记录
    await db.collection('history').doc(id).remove()

    return {
      code: 0,
      message: '删除成功'
    }
  } catch (err) {
    return {
      code: -1,
      message: '删除失败: ' + err.message
    }
  }
}
