/**
 * 迁移本地历史数据到云端
 * 用于一次性迁移旧数据
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

  // 从客户端传入本地历史数据
  const { localHistory } = event

  if (!localHistory || !Array.isArray(localHistory) || localHistory.length === 0) {
    return { code: 0, message: '没有需要迁移的数据', data: { migrated: 0 } }
  }

  try {
    let migratedCount = 0
    let skipCount = 0

    for (const item of localHistory) {
      // 检查必要字段
      if (!item.content) {
        skipCount++
        continue
      }

      // 检查是否已存在（根据内容和创建时间判断）
      const existing = await db.collection('history')
        .where({
          _openid: openid,
          content: item.content,
          createTime: db.command.gte(new Date(item.createTime || Date.now()))
        })
        .count()

      if (existing.total > 0) {
        skipCount++
        continue
      }

      // 插入到云端
      await db.collection('history').add({
        data: {
          _openid: openid,
          type: item.type || 'blessing',
          festival: item.festival || '',
          recipient: item.recipient || '',
          content: item.content,
          createTime: new Date(item.createTime || Date.now())
        }
      })

      migratedCount++
    }

    return {
      code: 0,
      message: '迁移完成',
      data: {
        migrated: migratedCount,
        skipped: skipCount,
        total: localHistory.length
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: '迁移失败: ' + err.message
    }
  }
}
