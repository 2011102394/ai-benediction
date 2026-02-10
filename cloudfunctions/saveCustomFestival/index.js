/**
 * 保存用户自定义节日
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name, theme } = event

  if (!name || !name.trim()) {
    return { code: -1, message: '节日名称不能为空' }
  }

  try {
    const newFestival = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      theme: theme || 'custom',
      icon: '🎊'
    }

    // 查询用户是否已有自定义记录
    const userRecord = await db.collection('user_custom_festivals')
      .where({ _openid: openid })
      .get()

    if (userRecord.data.length > 0) {
      // 更新现有记录
      await db.collection('user_custom_festivals').doc(userRecord.data[0]._id).update({
        data: {
          festivals: _.push(newFestival),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 创建新记录
      await db.collection('user_custom_festivals').add({
        data: {
          _openid: openid,
          festivals: [newFestival],
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      data: newFestival,
      message: '保存成功'
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '保存失败'
    }
  }
}
