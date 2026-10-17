import request from '@/utils/request'

// ============ 站内消息通知（段17 消息通知中心） ============
// 均为「本人消息」接口：未读数/最近未读登录即可用，列表/已读/删除挂权限点

// 本人消息列表（分页，支持 notifyType/readFlagQuery/title 筛选）
export function listNotify(query) {
  return request({ url: '/jiancha/notify/list', method: 'get', params: query })
}

// 未读数（顶栏铃铛轮询）
export function getUnreadCount() {
  return request({ url: '/jiancha/notify/unreadCount', method: 'get' })
}

// 未读数按类型分布（消息中心统计条）
export function getUnreadStat() {
  return request({ url: '/jiancha/notify/unreadStat', method: 'get' })
}

// 最近未读预览（铃铛下拉，最多 10 条）
export function listRecentNotify() {
  return request({ url: '/jiancha/notify/recent', method: 'get' })
}

// 标记单条已读
export function markNotifyRead(notifyId) {
  return request({ url: '/jiancha/notify/read/' + notifyId, method: 'put' })
}

// 全部已读
export function markAllNotifyRead() {
  return request({ url: '/jiancha/notify/readAll', method: 'put' })
}

// 删除本人单条消息
export function delNotify(notifyId) {
  return request({ url: '/jiancha/notify/' + notifyId, method: 'delete' })
}

// 清空本人已读消息
export function cleanReadNotify() {
  return request({ url: '/jiancha/notify/cleanRead', method: 'delete' })
}

// 导出本人消息清单（xlsx，当前筛选条件）
export function exportNotify(query) {
  return request({ url: '/jiancha/notify/export', method: 'post', params: query, responseType: 'blob' })
}
