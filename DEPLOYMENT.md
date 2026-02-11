# 小程序上线部署完整指南

## 一、前置准备

### 1.1 注册微信小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 点击「立即注册」→ 选择「小程序」
3. 填写邮箱、密码等基本信息
4. 邮箱验证后，填写账号信息
5. 选择主体类型（个人/企业）
   - **个人**：无需营业执照，但功能受限
   - **企业**：需要营业执照，功能完整

### 1.2 获取 AppID

注册成功后，在「开发」→「开发设置」中获取 **AppID**
- 当前项目 AppID：`wxf18dce92c195a6a3`

---

## 二、云开发配置

### 2.1 开通云开发

1. 登录 [微信云开发控制台](https://tcb.cloud.tencent.com)
2. 点击「立即使用」或「新建云环境」
3. 选择计费方式（免费套餐适合初期测试）
   - 免费额度：2GB 数据库、5GB 存储、5万次/天 读写
   - 按量付费：超出后按实际使用量计费

### 2.2 开通 AI 能力（混元大模型）

1. 在云开发控制台左侧点击 **「AI+」**
2. 报名 **「AI 小程序成长计划」** 领取免费额度
3. 免费额度：**1亿 Token**，可直接使用 `wx.cloud.extend.AI` 调用
4. 开通后无需配置 API Key，代码中可直接调用

### 2.3 创建数据库集合

在云开发控制台「数据库」中创建以下集合：

| 集合名称 | 用途 | 权限设置 |
|---------|------|---------|
| `user_custom_festivals` | 用户自定义节日 | 所有者可读写 |
| `user_custom_recipients` | 用户自定义祝福对象 | 所有者可读写 |
| `invite_records` | 邀请记录（防刷） | 所有者可读写 |
| `user_rewards` | 用户奖励统计 | 所有者可读写 |
| `history` | 历史记录（可选，自动创建） | 所有者可读写 |
| `festivals` | 预设节日列表（可选） | 所有者可读写 |

---

## 三、项目配置

### 3.1 配置 AppID

修改 `project.config.json`：
```json
{
  "appid": "你的AppID",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "nodeModules": true,
    "packNpmManually": true,
    "packNpmRelationList": [
      {
        "packageJsonPath": "./package.json",
        "miniprogramNpmDistDir": "./miniprogram_npm/"
      }
    ]
  }
}
```

### 3.2 配置 npm 依赖

1. 在微信开发者工具中点击 **「工具」→「构建 npm」**
2. 等待构建完成，生成 `miniprogram_npm/` 目录
3. 确认 `miniprogram_npm/lunar-javascript/` 存在

---

## 四、部署云函数

### 4.1 部署所有云函数

在微信开发者工具中，右键点击以下云函数文件夹，选择 **「上传并部署：云端安装依赖」」：

| 云函数 | 功能 | 优先级 |
|--------|------|--------|
| `login` | 用户登录获取 openid | ⭐⭐⭐ 必须部署 |
| `getFestivals` | 获取节日列表 | ⭐⭐⭐ 必须部署 |
| `getRecipients` | 获取祝福对象 | ⭐⭐⭐ 必须部署 |
| `saveHistory` | 保存历史记录 | ⭐⭐⭐ 必须部署 |
| `getHistory` | 获取历史记录 | ⭐⭐⭐ 必须部署 |
| `saveCustomFestival` | 保存自定义节日 | ⭐⭐ 可选（登录后使用） |
| `saveCustomRecipient` | 保存自定义对象 | ⭐⭐ 可选（登录后使用） |
| `getUserUsage` | 获取使用统计 | ⭐⭐⭐ 必须部署 |
| `syncUserUsage` | 同步使用次数 | ⭐⭐⭐ 必须部署 |
| `rewardInviter` | 奖励邀请人 | ⭐⭐⭐ 必须部署 |
| `initPresetData` | 初始化预设数据 | ⭐ 可选（初始化用） |
| `clearHistory` | 清空历史记录 | ⭐ 可选 |
| `deleteHistory` | 删除单条历史 | ⭐ 可选 |
| `migrateHistory` | 历史数据迁移 | ⭐ 可选 |

### 4.2 验证云函数部署

在云开发控制台「云函数」页面，确认所有云函数状态为「部署成功」

---

## 五、准备图片资源

### 5.1 底部导航栏图标

在 `images/` 文件夹中准备以下图标（建议尺寸 81px × 81px）：

| 图标 | 用途 | 路径 |
|------|------|------|
| 祝福语图标（选中态） | 底部导航栏 | `images/blessing-active.png` |
| 祝福语图标（未选中） | 底部导航栏 | `images/blessing.png` |
| 回复语图标（选中态） | 底部导航栏 | `images/reply-active.png` |
| 回复语图标（未选中） | 底部导航栏 | `images/reply.png` |
| 我的（选中态） | 底部导航栏 | `images/profile-active.png` |
| 我的（未选中） | 底部导航栏 | `images/profile.png` |

### 5.2 分享图片

- `images/share-cover.png`：分享封面，建议 500px × 400px

### 5.3 更新 app.json

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/blessing/blessing",
        "text": "祝福语",
        "iconPath": "images/blessing.png",
        "selectedIconPath": "images/blessing-active.png"
      },
      {
        "pagePath": "pages/reply/reply",
        "text": "回复语",
        "iconPath": "images/reply.png",
        "selectedIconPath": "images/reply-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "text": "我的",
        "iconPath": "images/profile.png",
        "selectedIconPath": "images/profile-active.png"
      }
    ]
  }
}
```

---

## 六、本地测试

### 6.1 真机调试

1. 点击微信开发者工具顶部 **「真机调试」**
2. 用手机扫码，在微信中打开
3. 测试所有功能：
   - [ ] 祝福语生成（春节和其他节日）
   - [ ] 回复语生成
   - [ ] 自定义节日和对象
   - [ ] 历史记录查看和删除
   - [ ] 复制功能
   - [ ] 分享功能

### 6.2 检查云函数日志

在云开发控制台「云函数」→「日志」中查看是否有错误

---

## 七、上传代码

### 7.1 版本号管理

在 `project.config.json` 中配置：
```json
{
  "projectname": "ai-benediction"
}
```

### 7.2 上传步骤

1. 点击微信开发者工具顶部 **「上传」**
2. 填写版本号（如 `1.0.0`）和项目备注
3. 点击「上传」等待完成

---

## 八、提交审核

### 8.1 在微信公众平台提交

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「版本管理」→「开发版本」
3. 点击「提交审核」
4. 填写审核信息：
   - **测试账号**：提供测试账号（可选）
   - **功能页面**：勾选所有功能页面
   - **类目**：选择「工具」→「其他」
   - **服务标签**：添加相关标签

### 8.2 常见驳回原因

| 原因 | 解决方案 |
|------|---------|
| 功能不完整 | 确保所有页面可正常访问 |
| 空白页面 | 检查云函数是否部署成功 |
| 缺少用户协议 | 添加用户协议页面 |
| 图片违规 | 更换合规图片 |

---

## 九、发布上线

### 9.1 审核通过后

1. 在微信公众平台「版本管理」→「审核版本」
2. 点击「发布」→「全量发布」
3. 确认发布信息，点击「确认发布」

### 9.2 发布后操作

- 监控云函数调用次数和数据库读写次数
- 观察用户反馈，及时修复 bug
- 如需要开通广告，在「流量主」模块申请

---

## 十、运营配置（可选）

### 10.1 开通流量主（激励视频广告）

1. 在微信公众平台进入「流量主」
2. 满足条件：1000+ 用户
3. 申请广告位，获取 `adUnitId`
4. 在代码中替换 `pages/blessing/blessing.js` 中的广告代码：

```javascript
// 取消注释广告相关代码（约 695-756 行）
const rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: '你的广告位ID' })
```

### 10.2 配置服务类目

1. 在「设置」→「基本设置」
2. 配置服务类目（如「工具」→「其他」）
3. 填写服务类目说明

---

## 十一、常见问题

### Q1: 云函数部署失败
- 检查网络连接
- 确认云开发环境已创建
- 查看云函数日志

### Q2: AI 调用失败
- 确认已报名「AI 小程序成长计划」
- 检查基础库版本是否 ≥ 3.5.0
- 查看云开发控制台 AI+ 页面状态

### Q3: 生肖显示错误
- 确认 npm 已构建成功
- 检查 `miniprogram_npm/lunar-javascript/` 是否存在

### Q4: 数据库集合创建失败
- 确认云开发环境已创建
- 检查数据库权限设置

---

## 十二、部署检查清单

### 功能测试
- [ ] 祝福语生成正常
- [ ] 回复语生成正常
- [ ] 生肖显示正确
- [ ] 主题切换正常
- [ ] 复制功能正常
- [ ] 分享功能正常
- [ ] 历史记录保存/读取正常
- [ ] 登录/登出正常
- [ ] 使用次数控制正常

### 配置检查
- [ ] AppID 已正确配置
- [ ] npm 已构建成功
- [ ] 所有云函数已部署
- [ ] 数据库集合已创建
- [ ] 图片资源已准备
- [ ] AI 能力已开通

### 合规检查
- [ ] 用户协议已添加
- [ ] 隐私政策已添加
- [ ] 图片资源合规
- [ ] 功能描述准确
