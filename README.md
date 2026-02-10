# AI祝福语生成工具 (ai-benediction)

基于微信小程序云开发的节日祝福语生成工具，集成混元大模型API实现智能祝福语生成功能。

## 核心功能

### 1. 节日选择模块
- 内置12个中国传统节日和常用节日
  - 春节、元宵节、清明节、端午节、中秋节、重阳节
  - 情人节、教师节、母亲节、父亲节、国庆节、元旦
- 支持用户自定义添加新节日

### 2. 祝福对象分类
- 预设10种祝福对象
  - 领导、同事、父母、长辈、朋友、爱人、老师、客户、同学、亲戚
- 支持用户自定义添加新类别

### 3. 智能生成
- 祝福语生成：根据节日+对象自动生成个性化祝福语
- 回复语生成：输入收到的祝福语，智能生成得体的回复

### 4. 节日主题UI
- 不同节日自动切换配色方案和视觉元素
- 突出节日氛围，提升用户体验

### 5. 使用限制与广告
- 每日5次免费使用
- 观看激励视频可获取额外次数（最多10次/天）
- 24小时滚动重置

## 技术架构

```
ai-benediction/
├── cloudfunctions/          # 云函数
│   ├── login/              # 用户登录获取openid
│   ├── generateBlessing/   # 生成祝福语
│   ├── generateReply/      # 生成回复语
│   ├── getFestivals/       # 获取节日列表
│   ├── saveCustomFestival/ # 保存自定义节日
│   ├── getRecipients/      # 获取祝福对象列表
│   └── saveCustomRecipient/# 保存自定义对象
├── pages/                   # 页面
│   ├── blessing/           # 祝福语生成首页
│   ├── reply/              # 回复语生成页
│   └── history/            # 历史记录页
├── utils/                   # 工具函数
│   ├── theme.js            # 节日主题配置
│   └── usage.js            # 使用次数控制
└── images/                  # 图片资源
```

## 混元大模型配置

在云函数 `generateBlessing` 和 `generateReply` 中配置环境变量：

1. 在微信开发者工具中，点击「云开发」→「云函数」→「环境变量」
2. 添加以下变量：
   - `OPENAI_API_KEY`: 你的 OpenAI 兼容接口 API Key
   - `OPENAI_BASE_URL`: 你的 OpenAI 兼容接口地址

或使用腾讯云提供的混元大模型 API。

## 部署步骤

### 1. 初始化云开发
- 在微信开发者工具中启用云开发
- 创建云开发环境

### 2. 部署云函数
```bash
# 在微信开发者工具中，右键点击每个云函数文件夹
# 选择「创建并部署：云端安装依赖」
```

需要部署的云函数：
- login
- generateBlessing
- generateReply
- getFestivals
- saveCustomFestival
- getRecipients
- saveCustomRecipient

### 3. 创建数据库集合
在云开发控制台数据库中创建以下集合：
- `user_custom_festivals`: 存储用户自定义节日
- `user_custom_recipients`: 存储用户自定义祝福对象

### 4. 配置项目
- 修改 `project.config.json` 中的 `appid` 为你自己的小程序 AppID
- 准备底部导航栏图标并放入 `images/` 文件夹

### 5. 编译预览
在微信开发者工具中编译预览，检查功能是否正常。

## 页面说明

### 祝福语页面 (pages/blessing)
- 选择节日和祝福对象
- 支持自定义添加节日和对象
- 生成并展示祝福语
- 支持复制和分享

### 回复语页面 (pages/reply)
- 选择节日和回复对象
- 输入收到的祝福语
- 生成得体的回复语

### 历史记录页面 (pages/history)
- 查看生成的祝福语和回复语历史
- 支持按类型筛选
- 支持复制和删除

## 自定义配置

### 修改每日免费次数
编辑 `utils/usage.js`：
```javascript
const MAX_FREE = 5      // 修改免费次数
const MAX_TOTAL = 15    // 修改总次数上限
```

### 添加新节日主题
编辑 `utils/theme.js`，在 `FESTIVAL_THEMES` 中添加新主题：
```javascript
newfestival: {
  name: '新节日',
  primaryColor: '#颜色代码',
  secondaryColor: '#颜色代码',
  backgroundColor: '#颜色代码',
  gradient: 'linear-gradient(...)',
  icon: '🔔',
  decorations: ['🎊', '✨']
}
```

### 修改预设节日/对象
编辑对应云函数：
- `cloudfunctions/getFestivals/index.js` - 修改预设节日
- `cloudfunctions/getRecipients/index.js` - 修改预设对象

## 注意事项

1. **混元API配置**：生产环境建议使用环境变量配置API Key，不要硬编码在代码中
2. **激励视频广告**：需要在小程序后台申请广告组件，替换 `adUnitId` 为真实的广告位ID
3. **云开发额度**：注意云开发的免费额度，超出后可能产生费用

## License

MIT
