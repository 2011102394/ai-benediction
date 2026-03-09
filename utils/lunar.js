/**
 * 农历日期工具 - 基于 lunar-javascript
 *
 * 功能：
 * - 公历/农历互转
 * - 获取生肖、干支、节气等信息
 * - 支持范围：1891-2100年
 */

import { Solar, Lunar } from 'lunar-javascript'

/**
 * 获取当前日期的农历和生肖信息
 * @returns {Object} 农历信息对象
 */
function getZodiacInfo() {
  const solar = Solar.fromDate(new Date())
  const lunar = solar.getLunar()

  return {
    // 农历年
    year: lunar.getYear(),
    yearInChinese: lunar.getYearInChinese(),

    // 生肖
    zodiac: lunar.getYearShengXiao(),
    zodiacInChinese: lunar.getYearShengXiao(),

    // 农历月日
    month: lunar.getMonth(),
    monthInChinese: lunar.getMonthInChinese(),
    day: lunar.getDay(),
    dayInChinese: lunar.getDayInChinese(),

    // 干支
    ganzhiYear: lunar.getYearInGanZhi(),
    ganzhiMonth: lunar.getMonthInGanZhi(),
    ganzhiDay: lunar.getDayInGanZhi(),

    // 节日和节气
    festivals: lunar.getFestivals(),
    jieQi: lunar.getJieQi(),

    // 公历日期
    solar: {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
      week: solar.getWeek()  // 0-6 (周日-周六)
    }
  }
}

/**
 * 根据公历日期获取农历信息
 * @param {number} year - 公历年
 * @param {number} month - 公历月 (1-12)
 * @param {number} day - 公历日
 * @returns {Object} 农历信息对象
 */
function getLunarDate(year, month, day) {
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const lunarMonth = lunar.getMonth()

  return {
    solar: {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
      week: solar.getWeek(),
      weekInChinese: solar.getWeekInChinese()
    },
    lunar: {
      year: lunar.getYear(),
      yearInChinese: lunar.getYearInChinese(),
      month: Math.abs(lunarMonth),  // 取绝对值，闰月为负数
      monthInChinese: lunar.getMonthInChinese(),
      day: lunar.getDay(),
      dayInChinese: lunar.getDayInChinese(),
      isLeap: lunarMonth < 0  // 月为负数表示闰月
    },
    zodiac: lunar.getYearShengXiao(),
    ganzhiYear: lunar.getYearInGanZhi(),
    festivals: lunar.getFestivals(),
    jieQi: lunar.getJieQi()
  }
}

/**
 * 获取指定年份的春节日期（公历）
 * @param {number} year - 农历年
 * @returns {Object} 春节日期信息
 */
function getSpringFestivalDate(year) {
  // 正月初一就是春节
  const lunar = Lunar.fromYmd(year, 1, 1)
  const solar = lunar.getSolar()

  return {
    solar: {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay()
    },
    lunar: {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay()
    },
    date: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`,
    week: solar.getWeek(),
    weekInChinese: solar.getWeekInChinese()
  }
}

/**
 * 判断给定公历日期所属的农历年
 * 用于确定该日期应该使用哪个生肖年份的祝福语
 *
 * @param {number} year - 公历年
 * @param {number} month - 公历月 (1-12)
 * @param {number} day - 公历日
 * @param {boolean} forSpringFestival - 是否为春节祝福（春节祝福逻辑略有不同）
 * @returns {Object} 农历年和生肖信息
 */
function getLunarYearForDate(year, month, day, forSpringFestival = false) {
  const lunarInfo = getLunarDate(year, month, day)

  // 获取该农历年的春节日期（正月初一）
  const springFestival = getSpringFestivalDate(lunarInfo.lunar.year)

  // 计算当前公历日期与该农历年春节的天数差
  const currentDate = new Date(year, month - 1, day)
  const springDate = new Date(
    springFestival.solar.year,
    springFestival.solar.month - 1,
    springFestival.solar.day
  )
  const daysDiff = Math.floor((currentDate - springDate) / (1000 * 60 * 60 * 24))

  let lunarYear = lunarInfo.lunar.year
  let targetZodiac = lunarInfo.zodiac

  if (forSpringFestival) {
    // 春节祝福的特殊逻辑：
    // 春节前30天开始就算新的一年（包含年二十九、年三十等）
    // 但如果已经是第二年1月底，可能应该判断是否需要用下一年
    if (daysDiff < -30) {
      // 还没到春节前30天，算上一年
      lunarYear = lunarInfo.lunar.year - 1
      const prevSpring = getSpringFestivalDate(lunarYear)
      targetZodiac = Lunar.fromYmd(lunarYear, 1, 1).getYearShengXiao()
    } else if (daysDiff > 30) {
      // 已经过了春节30天，但农历年还没更新（闰月情况）
      // 可能需要判断是否已经到了下一个农历年
      const nextLunarInfo = getLunarDate(year, month + 1, 1)
      if (nextLunarInfo.lunar.year > lunarInfo.lunar.year) {
        lunarYear = nextLunarInfo.lunar.year
        targetZodiac = nextLunarInfo.zodiac
      }
    }
  } else {
    // 非春节祝福，按农历年算即可
    // 如果当前日期在春节前，算上一年
    if (daysDiff < 0) {
      lunarYear = lunarInfo.lunar.year - 1
      const prevSpring = getSpringFestivalDate(lunarYear)
      targetZodiac = Lunar.fromYmd(lunarYear, 1, 1).getYearShengXiao()
    }
  }

  return {
    lunarYear,
    zodiac: targetZodiac,
    zodiacInChinese: targetZodiac,
    ganzhiYear: Lunar.fromYmd(lunarYear, 1, 1).getYearInGanZhi(),
    daysToSpring: daysDiff,  // 距离春节的天数（负数表示春节前）
    currentLunar: lunarInfo,
    springFestival: springFestival
  }
}

/**
 * 获取当前日期的生肖年份信息（用于祝福语创作）
 * @param {boolean} isSpringFestival - 是否为春节祝福
 * @returns {Object} 包含农历年、生肖等信息的对象
 */
function getCurrentYearInfo(isSpringFestival = false) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  return getLunarYearForDate(year, month, day, isSpringFestival)
}

/**
 * 获取干支生肖年描述
 * @param {number} lunarYear - 农历年
 * @returns {string} 如"2025乙巳年(蛇年)"
 */
function getGanZhiZodiacYear(lunarYear) {
  const lunar = Lunar.fromYmd(lunarYear, 1, 1)
  return `${lunarYear}年${lunar.getYearInGanZhi()}(${lunar.getYearShengXiao()}年)`
}

/**
 * 获取星座
 * @param {number} month - 月
 * @param {number} day - 日
 * @returns {string} 星座名称
 */
function getConstellation(month, day) {
  return Solar.fromYmd(new Date().getFullYear(), month, day).getXingZuo()
}

/**
 * 获取二十四节气信息
 * @param {number} year - 公历年
 * @returns {Array} 节气列表
 */
function getJieQiList(year) {
  const solar = Solar.fromYmd(year, 1, 1)
  const lunar = solar.getLunar()
  return lunar.getJieQiList()
}

module.exports = {
  // 基础功能
  getZodiacInfo,
  getLunarDate,
  getSpringFestivalDate,

  // 年份判断（核心功能）
  getLunarYearForDate,
  getCurrentYearInfo,

  // 辅助功能
  getGanZhiZodiacYear,
  getConstellation,
  getJieQiList,

  // 导出原始类以支持高级用法
  Solar,
  Lunar
}
