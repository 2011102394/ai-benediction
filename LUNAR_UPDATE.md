# Lunar-javascript 集成说明

## 已完成的工作

### 1. 创建 package.json
添加了 `lunar-javascript` 依赖，版本 `^1.6.12`

### 2. 创建 utils/lunar.js
封装了常用的农历相关功能：
- `getZodiacInfo()` - 获取当前日期的农历和生肖信息
- `getLunarDate(year, month, day)` - 公历转农历
- `getSpringFestivalDate(year)` - 获取指定年份的春节日期
- `getCurrentYearInfo(isSpringFestival)` - 获取当前年份的生肖信息（用于祝福语生成）
- `getGanZhiZodiacYear(lunarYear)` - 获取干支生肖年描述

### 3. 更新 pages/blessing/blessing.js
- 引入 `getCurrentYearInfo` 工具函数
- 替换了旧的硬编码生肖判断逻辑
- 简化代码，支持 1891-2100 年范围

### 4. 更新 project.config.json
- 启用了 `nodeModules: true`
- 配置了 npm 构建路径为 `miniprogram_npm/`

---

## 需要在微信开发者工具中完成的操作

### 构建npm
1. 打开微信开发者工具
2. 点击顶部菜单 `工具` -> `构建 npm`
3. 等待构建完成，会生成 `miniprogram_npm` 文件夹

### 验证构建结果
构建成功后，项目目录应包含：
```
miniprogram_npm/
└── lunar-javascript/
    ├── index.js
    └── package.json
```

---

## 新旧代码对比

### 旧代码（硬编码）
```javascript
getLunarYearInfo(isSpringFestival = false) {
  const ZODIAC_ANIMALS = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊']
  const SPRING_FESTIVAL_DATES = {
    2020: { month: 1, day: 25 },
    2021: { month: 2, day: 12 },
    // ... 需要每年手动更新
  }
  // 复杂的判断逻辑...
}
```

### 新代码（使用 lunar-javascript）
```javascript
getLunarYearInfo(isSpringFestival = false) {
  const lunarInfo = getCurrentYearInfo(isSpringFestival)
  return {
    lunarYear: lunarInfo.lunarYear,
    zodiac: lunarInfo.zodiac,
    ganzhiYear: lunarInfo.ganzhiYear,
    gregorianDate: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
    daysToSpring: lunarInfo.daysToSpring
  }
}
```

---

## 优势

| 维度 | 旧方案 | 新方案 |
|------|--------|--------|
| **日期范围** | 2020-2030 | 1891-2100 |
| **维护成本** | 需每年手动更新 | 零维护 |
| **功能完整度** | 仅生肖 | 生肖、干支、节气、节日等 |
| **准确度** | 依赖人工输入 | 基于天文数据 |
| **代码复杂度** | ~50行 | ~10行 |

---

## 扩展功能

如果未来需要更多农历相关功能，utils/lunar.js 已支持：

```javascript
// 获取完整农历信息
const info = getZodiacInfo()
console.log(info)
// {
//   year: 2025,
//   zodiac: '蛇',
//   ganzhiYear: '乙巳',
//   festivals: [...],
//   jieQi: [...],
//   ...
// }

// 获取干支生肖年描述
const desc = getGanZhiZodiacYear(2025)
// "2025年乙巳(蛇年)"

// 获取当前节气
const jieQi = getJieQiList(2025)
```
