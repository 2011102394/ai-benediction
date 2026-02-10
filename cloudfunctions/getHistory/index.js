/**
 * 获取历史记录列表
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type = 'all', page = 1, pageSize = 20 } = event

  if (!openid) {
    return { code: -1, message: '未获取到用户标识' }
  }

  try {
    let query = db.collection('history').where({ _openid: openid })

    // 按类型筛选
    if (type !== 'all') {
      query = query.where({ type: type })
    }

    // 按时间倒序排列
    query = query.orderBy('createTime', 'desc')

    // 分页
    const skip = (page - 1) * pageSize
    const listRes = await query.skip(skip).limit(pageSize).get()

    // 获取总数
    const countRes = await db.collection('history')
      .where({ _openid: openid, ...(type !== 'all' && { type }) })
      .count()

    return {
      code: 0,
      message: '获取成功',
      data: {
        list: listRes.data,
        total: countRes.total,
        hasMore: countRes.total > skip + listRes.data.length
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: '获取失败: ' + err.message
    }
  }
}
