/**
 * 保存用户自定义祝福对象
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name } = event

  if (!name || !name.trim()) {
    return { code: -1, message: '对象名称不能为空' }
  }

  try {
    const newRecipient = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      icon: '😊'
    }

    // 查询用户是否已有自定义记录
    const userRecord = await db.collection('user_custom_recipients')
      .where({ _openid: openid })
      .get()

    if (userRecord.data.length > 0) {
      // 更新现有记录
      await db.collection('user_custom_recipients').doc(userRecord.data[0]._id).update({
        data: {
          recipients: _.push(newRecipient),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 创建新记录
      await db.collection('user_custom_recipients').add({
        data: {
          _openid: openid,
          recipients: [newRecipient],
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      data: newRecipient,
      message: '保存成功'
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '保存失败'
    }
  }
}
