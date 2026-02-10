/**
 * 节日主题配置工具
 */

// 节日主题配色方案
const FESTIVAL_THEMES = {
  spring: {
    name: '春节',
    primaryColor: '#D32F2F',
    secondaryColor: '#FFD700',
    backgroundColor: '#FFF8F0',
    gradient: 'linear-gradient(135deg, #D32F2F 0%, #FF6B6B 100%)',
    icon: '🧧',
    decorations: ['🏮', '🎆', '✨', '🧨']
  },
  lantern: {
    name: '元宵',
    primaryColor: '#FF6B6B',
    secondaryColor: '#FFF8E1',
    backgroundColor: '#FFF9F5',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%)',
    icon: '🏮',
    decorations: ['🏮', '🥣', '🌕', '✨']
  },
  qingming: {
    name: '清明',
    primaryColor: '#4CAF50',
    secondaryColor: '#E8F5E9',
    backgroundColor: '#F1F8E9',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    icon: '🌿',
    decorations: ['🌿', '🌧️', '🌸', '🍃']
  },
  dragon: {
    name: '端午',
    primaryColor: '#2E7D32',
    secondaryColor: '#FF9800',
    backgroundColor: '#F0F8E8',
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    icon: '🐉',
    decorations: ['🐉', '🛶', '🍃', '🥮']
  },
  midautumn: {
    name: '中秋',
    primaryColor: '#FF9800',
    secondaryColor: '#FFF3E0',
    backgroundColor: '#FFF9F0',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
    icon: '🌕',
    decorations: ['🌕', '🐇', '🥮', '✨']
  },
  chongyang: {
    name: '重阳',
    primaryColor: '#795548',
    secondaryColor: '#D7CCC8',
    backgroundColor: '#FAF7F5',
    gradient: 'linear-gradient(135deg, #795548 0%, #A1887F 100%)',
    icon: '🌼',
    decorations: ['🌼', '🏔️', '🍂', '🧗']
  },
  custom: {
    name: '自定义',
    primaryColor: '#1976D2',
    secondaryColor: '#BBDEFB',
    backgroundColor: '#F0F7FF',
    gradient: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
    icon: '🎊',
    decorations: ['🎊', '✨', '🎉', '💫']
  }
}

/**
 * 获取主题配置
 */
function getTheme(themeKey) {
  return FESTIVAL_THEMES[themeKey] || FESTIVAL_THEMES.custom
}

/**
 * 获取所有主题
 */
function getAllThemes() {
  return FESTIVAL_THEMES
}

/**
 * 获取主题样式（用于动态设置页面样式）
 */
function getThemeStyles(themeKey) {
  const theme = getTheme(themeKey)
  return {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--background-color': theme.backgroundColor,
    '--gradient': theme.gradient
  }
}

module.exports = {
  getTheme,
  getAllThemes,
  getThemeStyles,
  FESTIVAL_THEMES
}
