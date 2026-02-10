/**
 * 个人信息编辑页面
 */
const { getUserInfo, syncUserToCloud } = require('../../utils/user.js')

// 默认头像地址（微信官方默认头像）
const DEFAULT_AVATAR_URL = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    tempAvatarUrl: '',
    tempNickName: ''
  },

  onLoad() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = getUserInfo()
    if (userInfo) {
      // 处理 null 值：null、undefined、空字符串都视为空
      const nickName = userInfo.nickName
      const isEmpty = nickName === null || nickName === undefined || nickName === ''
      const isDefaultNick = isEmpty || nickName === '微信用户'
      
      this.setData({
        tempAvatarUrl: userInfo.avatarUrl && !userInfo.avatarUrl.includes('132') 
          ? userInfo.avatarUrl 
          : '',
        tempNickName: isDefaultNick ? '' : nickName
      })
    }
  },

  // 选择头像 - 微信官方推荐方式
  // 用户点击头像行后，微信会弹出头像选择器
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    // 头像链接是临时路径，需要上传到云存储
    this.setData({ 
      tempAvatarUrl: avatarUrl 
    })
  },

  // 输入昵称
  onNickNameInput(e) {
    this.setData({ tempNickName: e.detail.value })
  },

  // 上传头像到云存储
  async uploadAvatarToCloud(tempFilePath) {
    try {
      const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const res = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })
      return res.fileID
    } catch (err) {
      console.error('头像上传失败:', err)
      throw err
    }
  },

  // 保存个人资料
  async saveProfile() {
    const { tempAvatarUrl, tempNickName } = this.data
    
    // 处理昵称：null、undefined、空字符串都转为"微信用户"
    // 字符串"null"视为有效昵称
    const safeNick = tempNickName === null || tempNickName === undefined ? '' : String(tempNickName)
    const trimmedNick = safeNick.trim()
    const finalNickName = trimmedNick === '' ? '微信用户' : trimmedNick

    try {
      wx.showLoading({ title: '保存中...' })
      
      let finalAvatarUrl = tempAvatarUrl
      
      // 如果头像以 http://tmp/ 开头，说明是临时文件，需要上传到云存储
      if (tempAvatarUrl && tempAvatarUrl.startsWith('http://tmp/')) {
        finalAvatarUrl = await this.uploadAvatarToCloud(tempAvatarUrl)
      }
      
      // 更新本地存储
      const userInfo = {
        ...getUserInfo(),
        nickName: finalNickName,
        avatarUrl: finalAvatarUrl || getUserInfo()?.avatarUrl
      }
      wx.setStorageSync('userInfo', userInfo)

      // 同步到云端
      await syncUserToCloud(userInfo)

      wx.showToast({ 
        title: '保存成功', 
        icon: 'success',
        success: () => {
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 500)
        }
      })
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
