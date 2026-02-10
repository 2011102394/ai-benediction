/**
 * 初始化预设数据云函数
 * 将节日和祝福对象预设数据插入数据库
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 预设节日列表
const PRESET_FESTIVALS = [
  { id: 'spring', name: '春节', theme: 'spring', type: 'preset', icon: '🧧', sort: 1 },
  { id: 'lantern', name: '元宵节', theme: 'lantern', type: 'preset', icon: '🏮', sort: 2 },
  { id: 'qingming', name: '清明节', theme: 'qingming', type: 'preset', icon: '🌿', sort: 3 },
  { id: 'dragon', name: '端午节', theme: 'dragon', type: 'preset', icon: '🐉', sort: 4 },
  { id: 'midautumn', name: '中秋节', theme: 'midautumn', type: 'preset', icon: '🌕', sort: 5 },
  { id: 'chongyang', name: '重阳节', theme: 'chongyang', type: 'preset', icon: '🌼', sort: 6 },
  { id: 'valentine', name: '情人节', theme: 'custom', type: 'preset', icon: '💕', sort: 7 },
  { id: 'teacher', name: '教师节', theme: 'custom', type: 'preset', icon: '📚', sort: 8 },
  { id: 'mother', name: '母亲节', theme: 'custom', type: 'preset', icon: '🌸', sort: 9 },
  { id: 'father', name: '父亲节', theme: 'custom', type: 'preset', icon: '👔', sort: 10 },
  { id: 'national', name: '国庆节', theme: 'spring', type: 'preset', icon: '🇨🇳', sort: 11 },
  { id: 'newyear', name: '元旦', theme: 'lantern', type: 'preset', icon: '🎉', sort: 12 }
]

// 预设祝福对象
const PRESET_RECIPIENTS = [
  { id: 'leader', name: '领导', type: 'preset', icon: '👔', sort: 1 },
  { id: 'colleague', name: '同事', type: 'preset', icon: '👥', sort: 2 },
  { id: 'parent', name: '父母', type: 'preset', icon: '👨‍👩‍👧', sort: 3 },
  { id: 'elder', name: '长辈', type: 'preset', icon: '👴', sort: 4 },
  { id: 'friend', name: '朋友', type: 'preset', icon: '🧑‍🤝‍🧑', sort: 5 },
  { id: 'lover', name: '爱人', type: 'preset', icon: '💑', sort: 6 },
  { id: 'teacher', name: '老师', type: 'preset', icon: '👨‍🏫', sort: 7 },
  { id: 'client', name: '客户', type: 'preset', icon: '🤝', sort: 8 },
  { id: 'classmate', name: '同学', type: 'preset', icon: '🎓', sort: 9 },
  { id: 'relative', name: '亲戚', type: 'preset', icon: '👨‍👩‍👧‍👦', sort: 10 }
]

exports.main = async (event, context) => {
  try {
    // 初始化节日数据
    const festivalsCollection = db.collection('festivals')
    const festivalsCount = await festivalsCollection.count()
    
    if (festivalsCount.total === 0) {
      // 批量插入预设节日
      const batch = festivalsCollection.limit(100)
      for (const festival of PRESET_FESTIVALS) {
        await festivalsCollection.add({
          data: {
            ...festival,
            createTime: db.serverDate()
          }
        })
      }
    }

    // 初始化祝福对象数据
    const recipientsCollection = db.collection('recipients')
    const recipientsCount = await recipientsCollection.count()
    
    if (recipientsCount.total === 0) {
      // 批量插入预设对象
      for (const recipient of PRESET_RECIPIENTS) {
        await recipientsCollection.add({
          data: {
            ...recipient,
            createTime: db.serverDate()
          }
        })
      }
    }

    return {
      code: 0,
      message: '预设数据初始化完成',
      data: {
        festivalsInserted: festivalsCount.total === 0 ? PRESET_FESTIVALS.length : 0,
        recipientsInserted: recipientsCount.total === 0 ? PRESET_RECIPIENTS.length : 0
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '初始化失败'
    }
  }
}
