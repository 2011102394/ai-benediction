/**
 * 历史记录页面（云端版）
 */
const { isLoggedIn } = require('../../utils/user.js')

Page({
  data: {
    allHistoryList: [],
    filteredList: [],
    filterType: 'all',
    totalCount: 0,
    blessingCount: 0,
    replyCount: 0,
    isLogin: false
  },

  onLoad() {
    this.checkLoginAndLoad()
  },

  onShow() {
    this.checkLoginAndLoad()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad() {
    const loggedIn = isLoggedIn()
    this.setData({ isLogin: loggedIn })
    
    if (loggedIn) {
      this.loadHistory()
    }
  },

  // 跳转到个人中心登录
  goToLogin() {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  // 加载历史记录（从云端）
  async loadHistory() {
    wx.showLoading({ title: '加载中...' })

    try {
      // 加载全部历史记录用于统计
      const allRes = await wx.cloud.callFunction({
        name: 'getHistory',
        data: {
          type: 'all',
          page: 1,
          pageSize: 1000
        }
      })

      if (allRes.result.code === 0) {
        const allList = allRes.result.data.list
        // 为每个 item 添加格式化时间
        const listWithTime = allList.map(item => ({
          ...item,
          formattedTime: this.formatTime(item.createTime)
        }))
        this.setData({ allHistoryList: listWithTime })

        // 计算祝福语和回复语数量
        this.calculateCounts(listWithTime)

        // 根据当前筛选条件过滤
        this.applyFilter(listWithTime)
      } else {
        wx.showToast({ title: allRes.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 应用筛选条件
  applyFilter(allList) {
    let filtered = allList
    if (this.data.filterType !== 'all') {
      filtered = allList.filter(item => item.type === this.data.filterType)
    }
    // 初始化展开状态
    const initializedList = this.initExpandState(filtered)
    this.setData({
      filteredList: initializedList
    })
  },

  // 切换筛选
  switchFilter(e) {
    const type = e.currentTarget.dataset.type

    // 如果点击的是当前选中的筛选，不重复加载
    if (type === this.data.filterType) return

    this.setData({ filterType: type })

    // 使用本地数据进行筛选
    this.applyFilter(this.data.allHistoryList)
  },

  // 复制内容
  copyContent(e) {
    const content = e.currentTarget.dataset.content
    wx.setClipboardData({
      data: content,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  // 删除单条记录
  async deleteItem(e) {
    const id = e.currentTarget.dataset.id
    const res = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？'
    })

    if (!res.confirm) return

    wx.showLoading({ title: '删除中...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'deleteHistory',
        data: { id }
      })

      if (result.result.code === 0) {
        // 从全部记录中移除
        const newAllList = this.data.allHistoryList.filter(item => item._id !== id)

        // 更新全部记录
        this.setData({ allHistoryList: newAllList })

        // 重新应用筛选
        this.applyFilter(newAllList)

        // 更新计数
        this.calculateCounts(newAllList)

        wx.showToast({ title: '已删除', icon: 'success' })
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 清空历史
  async clearHistory() {
    if (this.data.allHistoryList.length === 0) {
      wx.showToast({ title: '暂无记录', icon: 'none' })
      return
    }

    const res = await wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      confirmColor: '#D32F2F'
    })

    if (!res.confirm) return

    wx.showLoading({ title: '清空中...' })

    try {
      const result = await wx.cloud.callFunction({
        name: 'clearHistory'
      })

      if (result.result.code === 0) {
        this.setData({
          allHistoryList: [],
          filteredList: [],
          totalCount: 0,
          blessingCount: 0,
          replyCount: 0
        })
        wx.showToast({ title: `已清空 ${result.result.data.deletedCount} 条记录`, icon: 'success' })
      } else {
        wx.showToast({ title: result.result.message, icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '清空失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 格式化时间
  formatTime(isoString) {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  },

  // 切换展开/折叠状态
  toggleExpand(e) {
    const index = e.currentTarget.dataset.index
    const filteredList = [...this.data.filteredList]
    filteredList[index].isExpanded = !filteredList[index].isExpanded
    this.setData({ filteredList })
  },

  // 计算祝福语和回复语数量
  calculateCounts(list) {
    const blessingCount = list.filter(item => item.type === 'blessing').length
    const replyCount = list.filter(item => item.type === 'reply').length
    const totalCount = list.length
    this.setData({ blessingCount, replyCount, totalCount })
  },

  // 初始化展开状态
  initExpandState(list) {
    return list.map(item => ({
      ...item,
      isExpanded: false
    }))
  }
})
