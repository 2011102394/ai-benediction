# 数据库初始化指南

## 概述

项目已将预设的节日和祝福对象数据迁移到云数据库中，需要创建以下集合：

- `festivals` - 存储预设节日数据
- `recipients` - 存储预设祝福对象数据
- `user_custom_festivals` - 存储用户自定义节日
- `user_custom_recipients` - 存储用户自定义祝福对象
- `users` - 存储登录用户信息和使用次数
- `invite_records` - 存储邀请记录
- `history` - 存储用户历史记录（云端版）

## 步骤

### 1. 创建集合

在云开发控制台中：

1. 点击「**云开发**」→「**数据库**」
2. 点击「**添加集合**」，依次创建以下7个集合：
   - `festivals`
   - `recipients`
   - `user_custom_festivals`
   - `user_custom_recipients`
   - `users`
   - `invite_records`
   - `history`

### 2. 设置集合权限

对每个集合设置权限：

- **festivals** 和 **recipients**：「**所有用户可读，仅管理员可写**」
- **user_custom_festivals**、**user_custom_recipients**、**users**、**invite_records**、**history**：「**所有用户可读，仅创建者可写**」

设置方法：
1. 点击集合名称
2. 点击「**权限设置**」
3. 选择对应的权限模板

### 3. 初始化预设数据

#### 方法A：使用云函数初始化（推荐）

1. 在微信开发者工具中，右键 `cloudfunctions/initPresetData` 文件夹
2. 选择「**创建并部署：云端安装依赖**」
3. 部署成功后，在「**云开发**」→「**云函数**」中找到 `initPresetData`
4. 点击「**云端测试**」，运行该函数
5. 查看返回结果，确认数据已插入

#### 方法B：手动导入数据

如果不想使用云函数，可以手动导入数据：

1. 点击 `festivals` 集合 →「**导入**」
2. 导入以下JSON数据：

```json
{"id":"spring","name":"春节","theme":"spring","type":"preset","icon":"🧧","sort":1}
{"id":"lantern","name":"元宵节","theme":"lantern","type":"preset","icon":"🏮","sort":2}
{"id":"qingming","name":"清明节","theme":"qingming","type":"preset","icon":"🌿","sort":3}
{"id":"dragon","name":"端午节","theme":"dragon","type":"preset","icon":"🐉","sort":4}
{"id":"midautumn","name":"中秋节","theme":"midautumn","type":"preset","icon":"🌕","sort":5}
{"id":"chongyang","name":"重阳节","theme":"chongyang","type":"preset","icon":"🌼","sort":6}
{"id":"valentine","name":"情人节","theme":"custom","type":"preset","icon":"💕","sort":7}
{"id":"teacher","name":"教师节","theme":"custom","type":"preset","icon":"📚","sort":8}
{"id":"mother","name":"母亲节","theme":"custom","type":"preset","icon":"🌸","sort":9}
{"id":"father","name":"父亲节","theme":"custom","type":"preset","icon":"👔","sort":10}
{"id":"national","name":"国庆节","theme":"spring","type":"preset","icon":"🇨🇳","sort":11}
{"id":"newyear","name":"元旦","theme":"lantern","type":"preset","icon":"🎉","sort":12}
```

3. 点击 `recipients` 集合 →「**导入**」
4. 导入以下JSON数据：

```json
{"id":"leader","name":"领导","type":"preset","icon":"👔","sort":1}
{"id":"colleague","name":"同事","type":"preset","icon":"👥","sort":2}
{"id":"parent","name":"父母","type":"preset","icon":"👨‍👩‍👧","sort":3}
{"id":"elder","name":"长辈","type":"preset","icon":"👴","sort":4}
{"id":"friend","name":"朋友","type":"preset","icon":"🧑‍🤝‍🧑","sort":5}
{"id":"lover","name":"爱人","type":"preset","icon":"💑","sort":6}
{"id":"teacher","name":"老师","type":"preset","icon":"👨‍🏫","sort":7}
{"id":"client","name":"客户","type":"preset","icon":"🤝","sort":8}
{"id":"classmate","name":"同学","type":"preset","icon":"🎓","sort":9}
{"id":"relative","name":"亲戚","type":"preset","icon":"👨‍👩‍👧‍👦","sort":10}
```

### 4. 重新部署云函数

修改后的云函数需要重新部署：

1. 右键 `cloudfunctions/getFestivals` →「**创建并部署：云端安装依赖**」
2. 右键 `cloudfunctions/getRecipients` →「**创建并部署：云端安装依赖**」
3. 右键 `cloudfunctions/saveCustomFestival` →「**创建并部署：云端安装依赖**」
4. 右键 `cloudfunctions/saveCustomRecipient` →「**创建并部署：云端安装依赖**」
5. 右键 `cloudfunctions/syncUserUsage` →「**创建并部署：云端安装依赖**」
6. 右键 `cloudfunctions/getUserUsage` →「**创建并部署：云端安装依赖**」
7. 右键 `cloudfunctions/rewardInviter` →「**创建并部署：云端安装依赖**」
8. 右键 `cloudfunctions/saveHistory` →「**创建并部署：云端安装依赖**」
9. 右键 `cloudfunctions/getHistory` →「**创建并部署：云端安装依赖**」
10. 右键 `cloudfunctions/deleteHistory` →「**创建并部署：云端安装依赖**」
11. 右键 `cloudfunctions/clearHistory` →「**创建并部署：云端安装依赖**」

### 5. 验证

1. 在微信开发者工具中重新编译项目
2. 打开祝福语页面
3. 检查控制台是否有数据加载日志
4. 确认节日和祝福对象列表正常显示

## 数据结构说明

### festivals 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 节日唯一标识 |
| name | string | 节日名称 |
| theme | string | 主题标识（控制UI配色） |
| type | string | 类型：preset（预设） |
| icon | string | 图标emoji |
| sort | number | 排序序号 |

### recipients 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 对象唯一标识 |
| name | string | 对象名称 |
| type | string | 类型：preset（预设） |
| icon | string | 图标emoji |
| sort | number | 排序序号 |

### user_custom_festivals 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | string | 用户openid |
| festivals | array | 自定义节日列表 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |

### user_custom_recipients 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | string | 用户openid |
| recipients | array | 自定义对象列表 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |

### users 集合（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | string | 用户openid |
| nickName | string | 用户昵称 |
| avatarUrl | string | 头像URL |
| gender | number | 性别 |
| isLogin | boolean | 是否已授权登录 |
| freeCount | number | 今日剩余免费次数 |
| inviteCount | number | 邀请奖励次数累计 |
| totalInvited | number | 累计邀请人数 |
| totalUsed | number | 累计使用次数 |
| lastInitDate | string | 最后初始化日期 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |

### invite_records 集合（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| inviterId | string | 邀请人openid |
| date | string | 日期 |
| inviteCount | number | 当日邀请次数 |
| rewardCount | number | 奖励次数 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |

### history 集合（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | string | 用户openid |
| type | string | 类型：blessing（祝福语）/ reply（回复语） |
| festival | string | 节日名称 |
| recipient | string | 祝福对象 |
| content | string | 内容 |
| createTime | date | 创建时间 |

## 注意事项

1. **首次部署**：必须先创建集合并初始化数据，否则页面会显示"加载中"
2. **权限设置**：务必正确设置集合权限，避免数据安全问题
3. **排序**：可通过修改 `sort` 字段调整显示顺序
4. **扩展**：如需添加新节日/对象，直接在对应集合中添加记录即可
