/**
 * 个人信息编辑页面
 */
const { getUserInfo, syncUserToCloud } = require('../../utils/user.js')

Page({
  data: {
    tempAvatarUrl: '',
    tempNickName: '',
    showAvatarPopup: false,
    wxAvatarUrl: ''
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
        tempNickName: isDefaultNick ? '' : nickName,
        wxAvatarUrl: userInfo.avatarUrl || ''
      })
    }
  },

  // 显示头像选择弹窗
  chooseAvatar() {
    this.setData({ showAvatarPopup: true })
  },

  // 隐藏头像选择弹窗
  hideAvatarPopup() {
    this.setData({ showAvatarPopup: false })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 什么都不做，只是阻止冒泡
  },

  // 选择微信头像
  onChooseWxAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ 
      tempAvatarUrl: avatarUrl, 
      showAvatarPopup: false 
    })
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ 
          tempAvatarUrl: tempFilePath, 
          showAvatarPopup: false 
        })
      }
    })
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ 
          tempAvatarUrl: tempFilePath, 
          showAvatarPopup: false 
        })
      }
    })
  },

  // 输入昵称
  onNickNameInput(e) {
    this.setData({ tempNickName: e.detail.value })
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
      
      // 更新本地存储
      const userInfo = {
        ...getUserInfo(),
        nickName: finalNickName,
        avatarUrl: tempAvatarUrl || getUserInfo()?.avatarUrl
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
