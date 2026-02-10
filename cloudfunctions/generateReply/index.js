/**
 * 生成回复语云函数
 * 根据收到的祝福语智能生成回复
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
      { role: 'system', content: '你是一位懂礼仪的社交达人，擅长得体的节日祝福回复。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1024
  })

  return completion.choices[0].message.content
}

// 模拟回复
function mockReply(festival, recipient) {
  const replies = {
    'spring': '谢谢你的新年祝福！也祝你在新的一年里身体健康、工作顺利、阖家幸福！',
    'lantern': '感谢你的元宵祝福！祝你月圆人圆事事圆满！',
    'dragon': '谢谢你的端午祝福！也祝你端午安康，万事如意！',
    'midautumn': '感谢你的中秋祝福！月圆之夜，也祝你和家人团圆美满！'
  }
  return replies[festival] || '谢谢你的祝福！也祝你节日快乐，万事如意！'
}

exports.main = async (event, context) => {
  const { festival, festivalName, receivedBlessing, recipient, recipientName } = event
  
  if (!receivedBlessing || !recipient) {
    return { code: -1, message: '收到的祝福语和回复对象不能为空' }
  }

  const prompt = `你是一位懂礼仪的社交达人。请根据以下信息生成一段得体的祝福回复：

【节日】${festivalName || festival}
【收到祝福语】${receivedBlessing}
【回复对象】${recipientName || recipient}

要求：
1. 回复要真诚感谢对方的祝福
2. 回祝对方节日快乐
3. 根据对象身份调整语气
4. 字数控制在30-80字之间
5. 可以适当加入emoji
6. 直接输出回复语，不要解释

请直接输出回复语：`;

  try {
    let result
    if (OPENAI_CONFIG.apiKey && OPENAI_CONFIG.baseURL) {
      result = await callHunyuan(prompt)
    } else {
      result = mockReply(festival, recipient)
    }

    return { code: 0, data: result, message: '生成成功' }
  } catch (err) {
    return { 
      code: 0, 
      data: mockReply(festival, recipient), 
      message: '使用默认回复' 
    }
  }
}
