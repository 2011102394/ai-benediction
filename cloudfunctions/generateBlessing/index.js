/**
 * 生成祝福语云函数
 * 调用混元大模型生成个性化祝福语
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// ============================================
// 混元大模型配置（OpenAI 兼容接口）
// ============================================

// 配置方式一：环境变量（推荐，生产环境使用）
const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
}

// 配置方式二：直接填写（仅本地测试使用）
// const OPENAI_CONFIG = {
//   apiKey: 'sk-your-api-key-here',
//   baseURL: 'https://your-endpoint.tencentcloudapi.com/v1'
// }

// 调用混元大模型
async function callHunyuan(prompt) {
  const OpenAI = require('openai')
  
  if (!OPENAI_CONFIG.apiKey || !OPENAI_CONFIG.baseURL) {
    throw new Error('OpenAI 配置不完整')
  }

  const client = new OpenAI({
    apiKey: OPENAI_CONFIG.apiKey,
    baseURL: OPENAI_CONFIG.baseURL
  })

  const completion = await client.chat.completions.create({
    model: 'hunyuan-turbos-latest',
    messages: [
      { role: 'system', content: '你是一位擅长写节日祝福语的文案专家，生成的祝福语要温馨、得体、富有文采。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 1024
  })

  return completion.choices[0].message.content
}

// 模拟生成（备用）
function mockGenerate(festival, recipient) {
  const blessings = {
    'spring': {
      'leader': '值此新春佳节，恭祝您龙年大吉、事业腾达！感谢您一年来的悉心指导，新的一年愿在您的带领下再创佳绩，共铸辉煌！',
      'colleague': '新年快乐！感谢过去一年与你并肩作战的日子，祝新的一年工作顺利、步步高升，我们继续一起加油！',
      'parent': '爸妈，新年快乐！愿二老身体健康、笑口常开，新的一年我们多陪您，共享天伦之乐！',
      'elder': '爷爷奶奶，新春快乐！祝您们福如东海、寿比南山，岁岁平安、年年有余！',
      'friend': '兄弟/姐妹，过年好！祝新的一年暴富暴美、诸事顺遂，有空常聚！',
      'lover': '亲爱的，新年快乐！感谢有你相伴的每一天，愿新的一年我们的爱情甜甜蜜蜜，携手共赴美好未来！'
    },
    'lantern': {
      'leader': '元宵佳节，恭祝您月圆人圆事事圆满，灯红人红事业红火！',
      'colleague': '元宵节快乐！愿你像汤圆一样圆圆满满，工作生活甜甜蜜蜜！',
      'parent': '爸妈，元宵节快乐！愿二老身体康健，团团圆圆，幸福美满！',
      'friend': '元宵节到啦！祝你人圆事圆花好月圆，好运连连！'
    },
    'dragon': {
      'leader': '端午安康！祝您事业如龙舟竞发、勇立潮头，身体健康、万事顺遂！',
      'colleague': '端午节快乐！愿你事业蒸蒸日上，生活粽是甜蜜！',
      'parent': '爸妈，端午安康！愿二老身体硬朗，平安喜乐！',
      'friend': '端午到，粽飘香！祝兄弟端午安康，事业腾飞！'
    },
    'midautumn': {
      'leader': '中秋佳节，恭祝您月圆人圆事事圆，事业腾飞步步高！',
      'colleague': '中秋节快乐！愿你月圆家圆事业圆，幸福满满！',
      'parent': '爸妈，中秋快乐！月圆之夜，思念之情，愿二老健康长寿，我们永远爱您！',
      'lover': '亲爱的，中秋快乐！月圆人团圆，爱你永不变，愿我们的爱情如月光般永恒！'
    }
  }
  
  const festivalData = blessings[festival] || blessings['spring']
  return festivalData[recipient] || `祝您${festival}快乐，万事如意，身体健康，阖家幸福！`
}

exports.main = async (event, context) => {
  const { festival, festivalName, recipient, recipientName, style } = event
  
  if (!festival || !recipient) {
    return { code: -1, message: '节日和祝福对象不能为空' }
  }

  const prompt = `你是一位擅长写节日祝福语的文案专家。请根据以下信息生成一段温馨得体的祝福语：

【节日】${festivalName || festival}
【祝福对象】${recipientName || recipient}
【风格偏好】${style || '温馨亲切'}

要求：
1. 祝福语要符合节日氛围和传统文化
2. 根据对象身份调整语气和用词（对领导要尊敬、对父母要亲切、对朋友要活泼等）
3. 字数控制在50-100字之间
4. 语言优美、情感真挚、朗朗上口
5. 可以适当加入emoji增加活泼感
6. 直接输出祝福语，不要解释

【不同对象的语气参考】
- 领导：尊敬得体，表达感谢和祝福
- 同事/朋友：亲切自然，可以稍微活泼
- 父母/长辈：温暖孝顺，表达感恩
- 爱人：甜蜜浪漫，表达爱意

请直接输出祝福语：`;

  try {
    let result
    if (OPENAI_CONFIG.apiKey && OPENAI_CONFIG.baseURL) {
      result = await callHunyuan(prompt)
    } else {
      result = mockGenerate(festival, recipient)
    }

    return { code: 0, data: result, message: '生成成功' }
  } catch (err) {
    return { 
      code: 0, 
      data: mockGenerate(festival, recipient), 
      message: '使用默认祝福语' 
    }
  }
}
