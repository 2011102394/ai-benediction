/**
 * 保存历史记录到云端
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type, festival, recipient, content } = event

  if (!openid) {
    return { code: -1, message: '未获取到用户标识' }
  }

  if (!content) {
    return { code: -1, message: '内容不能为空' }
  }

  try {
    // 检查用户最近50条记录数量
    const countRes = await db.collection('history')
      .where({ _openid: openid })
      .count()

    // 如果超过50条，删除最早的
    if (countRes.total >= 50) {
      const oldRecords = await db.collection('history')
        .where({ _openid: openid })
        .orderBy('createTime', 'asc')
        .limit(countRes.total - 49)
        .get()

      for (const record of oldRecords.data) {
        await db.collection('history').doc(record._id).remove()
      }
    }

    // 添加新记录
    const result = await db.collection('history').add({
      data: {
        _openid: openid,
        type: type || 'blessing',
        festival: festival || '',
        recipient: recipient || '',
        content: content,
        createTime: db.serverDate()
      }
    })

    return {
      code: 0,
      message: '保存成功',
      data: { id: result._id }
    }
  } catch (err) {
    return {
      code: -1,
      message: '保存失败: ' + err.message
    }
  }
}
