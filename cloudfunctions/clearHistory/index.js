/**
 * 清空所有历史记录
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const MAX_LIMIT = 100

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: -1, message: '未获取到用户标识' }
  }

  try {
    // 批量删除用户所有记录
    const deleteBatch = async () => {
      const list = await db.collection('history')
        .where({ _openid: openid })
        .limit(MAX_LIMIT)
        .get()

      if (list.data.length === 0) {
        return 0
      }

      // 批量删除
      const batchDelete = list.data.map(item => {
        return db.collection('history').doc(item._id).remove()
      })

      await Promise.all(batchDelete)

      return list.data.length
    }

    let totalDeleted = 0
    let deleted = 0

    // 循环删除直到没有数据
    do {
      deleted = await deleteBatch()
      totalDeleted += deleted
    } while (deleted === MAX_LIMIT)

    return {
      code: 0,
      message: '清空成功',
      data: { deletedCount: totalDeleted }
    }
  } catch (err) {
    return {
      code: -1,
      message: '清空失败: ' + err.message
    }
  }
}
