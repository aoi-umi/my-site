import { Enum } from 'enum-ts'
const contentStatus = {
  草稿: 0,
  待审核: 1,
  审核通过: 2,
  审核不通过: 3,
  已删除: -1
}
const enumDefine = {
  authorityStatus: {
    禁用: 0,
    启用: 1
  },
  roleStatus: {
    禁用: 0,
    启用: 1
  },
  userStatus: {
    禁用: 0,
    待审核: 1,
    正常: 2
  },
  userBy: {
    微信授权: 'wxCode'
  },
  userBind: {
    微信: 'wx'
  },
  articleStatus: contentStatus,
  videoStatus: contentStatus,
  contentType: {
    文章: 0,
    视频: 1
  },
  articleContentType: {
    默认: 0,
    Markdown: 1
  },
  commentStatus: {
    正常: 0,
    已删除: -1
  },
  voteType: {
    文章: 0,
    视频: 1,
    评论: 10
  },
  voteValue: {
    无: 0,
    喜欢: 1,
    不喜欢: 2
  },
  followStatus: {
    未关注: 0,
    已关注: 1,
    已取消: -1
  },
  followQueryType: {
    关注: 1,
    粉丝: 2
  },
  assetSourceType: {
    微信: 1,
    支付宝: 2
  },
  assetType: {
    支付: 1,
    退款: 2
  },
  assetLogStatus: {
    未完成: 0,
    已完成: 1
  },
  payStatus: {
    未支付: 0,
    待处理: 1,
    已支付: 2,
    已取消: -1
  },
  payRefundStatus: {
    未退款: 0,
    已申请: 1,
    已退款: 2
  },
  notifyType: {
    微信: 1,
    支付宝: 2
  },
  goodsStatus: {
    上架: 1,
    下架: 0,
    已删除: -1
  },
  goodsSkuStatus: {
    上架: 1,
    下架: 0
  },

  socket: {
    弹幕接收: 'danmakuRecv',
    弹幕池连接: 'danmakuConnect',
    弹幕池断开: 'danmakuDisconnect',
    登录: 'login',
    登出: 'logout',
    私信接收: 'chatRecv',
    授权: '3rdPartyAuth',
    授权接收: '3rdPartyAuthRecv',
    支付: 'pay',
    支付回调: 'payCallback'
  },
  fileType: {
    图片: 'image',
    视频: 'video'
  },
  settingSignUpType: {
    开放: 0,
    限时开放: 1,
    关闭: 2,
    限时关闭: 3
  }
}

const enumDefineFront = {
  contentMgtType: {
    文章: 'article',
    视频: 'video'
  },
  contentOperateType: {
    查看: 0,
    评论: 1,
    赞: 2,
    踩: 3,
    收藏: 4,
    分享: 5
  },
  userEditType: {
    修改: 'edit',
    封禁: 'disable'
  },
  userDisableType: {
    解封: 0,
    封禁至: 1
  },
  userTab: {
    粉丝: 'follower',
    关注: 'following',
    视频: 'video',
    文章: 'article',
    私信: 'chat',
    收藏: 'favourite'
  },
  chatSendStatus: {
    发送中: 0,
    发送成功: 1,
    发送失败: -1
  },
  goodsResetType: {
    初始化: 0,
    规格数量: 1,
    规格值: 2
  },
  wxAuthType: {
    登录: 'login',
    绑定: 'bind',
    扫码: 'scan'
  }
}
export const enumDef = {
  ...enumDefine,
  ...enumDefineFront
}
export const myEnum = Enum.createInstance(enumDef)
