import request from '@/utils/request'

// ============ 廉政意见回复（E2）============

/** 申请列表（分页） */
export function listReply(query) {
  return request({ url: '/jiancha/reply/list', method: 'get', params: query })
}

/** 申请详情 */
export function getReply(requestId) {
  return request({ url: '/jiancha/reply/' + requestId, method: 'get' })
}

/** 新增申请 */
export function addReply(data) {
  return request({ url: '/jiancha/reply', method: 'post', data })
}

/** 修改申请 */
export function updateReply(data) {
  return request({ url: '/jiancha/reply', method: 'put', data })
}

/** 删除申请 */
export function delReply(requestId) {
  return request({ url: '/jiancha/reply/' + requestId, method: 'delete' })
}

/** 系统自动筛查（0 → 1，输出命中明细与建议结论） */
export function screenReply(requestId) {
  return request({ url: '/jiancha/reply/screen/' + requestId, method: 'post' })
}

/** 批量系统筛查（成批征求意见） */
export function screenReplyBatch(requestIds) {
  return request({ url: '/jiancha/reply/screenBatch', method: 'post', data: requestIds })
}

/** 出具回复意见（1 → 2） */
export function replyRequest(requestId, data) {
  return request({ url: '/jiancha/reply/reply/' + requestId, method: 'post', data })
}

/** 关闭申请（1/2 → 3） */
export function closeReply(requestId) {
  return request({ url: '/jiancha/reply/close/' + requestId, method: 'post' })
}

/** 筛查明细列表 */
export function listScreenItems(requestId) {
  return request({ url: '/jiancha/reply/screenItems/' + requestId, method: 'get' })
}

/** 人员检索（登记时选人） */
export function searchReplyPersons(keyword) {
  return request({ url: '/jiancha/reply/persons', method: 'get', params: { keyword } })
}

/** 统计 */
export function statReply() {
  return request({ url: '/jiancha/reply/stat', method: 'get' })
}
