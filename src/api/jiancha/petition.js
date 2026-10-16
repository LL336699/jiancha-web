import request from '@/utils/request'

// ============ 管理端（需登录） ============

// 查询举报列表（分页，不含内容与敏感字段）
export function listPetition(query) {
  return request({ url: '/jiancha/petition/list', method: 'get', params: query })
}

// 查询举报详情（敏感字段解密，审计留痕）
export function getPetition(petitionId) {
  return request({ url: '/jiancha/petition/' + petitionId, method: 'get' })
}

// 办理轨迹
export function getPetitionTrace(petitionId) {
  return request({ url: '/jiancha/petition/trace/' + petitionId, method: 'get' })
}

// 补充材料列表
export function getPetitionMaterial(petitionId) {
  return request({ url: '/jiancha/petition/material/' + petitionId, method: 'get' })
}

// 办理流转（受理/研判/分办/办理/反馈/归档/不予受理）
export function handlePetition(petitionId, data) {
  return request({ url: '/jiancha/petition/action', method: 'post', params: { petitionId }, data: data })
}

// 删除举报（级联轨迹与材料）
export function delPetition(petitionId) {
  return request({ url: '/jiancha/petition/' + petitionId, method: 'delete' })
}

// 同一被举报对象的历史举报（重复提示）
export function detectDuplicatePetition(targetName) {
  return request({ url: '/jiancha/petition/duplicate', method: 'get', params: { targetName } })
}

// 办理统计
export function petitionStat() {
  return request({ url: '/jiancha/petition/stat', method: 'get' })
}

// ============ 段16：留言 / 催办 / 督办（管理端） ============

// 举报留言列表（双方往来；打开即把举报人留言置为已读）
export function listPetitionMessage(petitionId) {
  return request({ url: '/jiancha/petition/message/' + petitionId, method: 'get' })
}

// 受理人回复举报留言
export function replyPetitionMessage(petitionId, content) {
  return request({ url: '/jiancha/petition/message/' + petitionId, method: 'post', data: { content } })
}

// 各举报的举报人留言未读数（列表红点提示）
export function petitionMessageUnread() {
  return request({ url: '/jiancha/petition/messageUnread', method: 'get' })
}

// 催办（urge_count+1 并写轨迹，不改变状态机）
export function urgePetition(petitionId, opinion) {
  return request({ url: '/jiancha/petition/urge/' + petitionId, method: 'post', data: { opinion } })
}

// 超期督办清单（未办结且超办理截止）
export function overduePetitions() {
  return request({ url: '/jiancha/petition/overdue', method: 'get' })
}

// ============ 段16：并案 / 导出 / 低分复核（管理端） ============

// 并案：把从件并入主件（同被举报对象，双侧写轨迹）
export function mergePetition(childId, masterId, remark) {
  return request({ url: '/jiancha/petition/merge/' + childId + '/' + masterId, method: 'post', data: { opinion: remark } })
}

// 解除并案：从件恢复独立办理
export function unmergePetition(childId) {
  return request({ url: '/jiancha/petition/unmerge/' + childId, method: 'post' })
}

// 并案候选清单（同被举报对象的其他非终态独立件）
export function mergeCandidates(petitionId) {
  return request({ url: '/jiancha/petition/mergeCandidates/' + petitionId, method: 'get' })
}

// 已并入指定主件的从件清单
export function mergedChildren(masterId) {
  return request({ url: '/jiancha/petition/mergedChildren/' + masterId, method: 'get' })
}

// 举报清单导出（Excel）
export function exportPetition(query) {
  return request({ url: '/jiancha/petition/export', method: 'post', params: query, responseType: 'blob' })
}

// 低分满意度复核清单（1-2 星）
export function dissatisfiedPetitions() {
  return request({ url: '/jiancha/petition/dissatisfied', method: 'get' })
}

// 手动触发超期自动催办（系统对超期未催办件各催办一次），返回催办件数
export function triggerAutoUrge() {
  return request({ url: '/jiancha/petition/autoUrge', method: 'post' })
}

// ============ 举报箱（免登录，@Anonymous） ============

// 提交举报（匿名/实名），返回回执码（仅此一次）
export function submitPetition(data) {
  return request({ url: '/public/petition/submit', method: 'post', data: data })
}

// 凭回执码查询办理进度
export function queryByReceipt(receiptCode) {
  return request({ url: '/public/petition/receipt/' + receiptCode, method: 'get' })
}

// 举报人凭回执码补充材料
export function appendMaterial(receiptCode, file) {
  const formData = new FormData()
  formData.append('receiptCode', receiptCode)
  formData.append('file', file)
  return request({ url: '/public/petition/material', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
}

// ============ 段16：双向留言 / 满意度评价（免登录，凭回执码） ============

// 举报人凭回执码留言
export function postMessageByReceipt(receiptCode, content) {
  return request({ url: '/public/petition/message', method: 'post', data: { receiptCode, content } })
}

// 举报人凭回执码拉取往来留言（打开即视为已读受理人回复）
export function listMessagesByReceipt(receiptCode) {
  return request({ url: '/public/petition/messages/' + receiptCode, method: 'get' })
}

// 举报人凭回执码评价满意度（1-5 星，办理结果反馈后开放）
export function rateByReceipt(receiptCode, satisfaction, comment) {
  return request({ url: '/public/petition/rate', method: 'post', data: { receiptCode, satisfaction, comment } })
}

// 举报箱公开字典（免登录独立页使用；管理端入口亦可复用）
export function getPublicDicts() {
  return request({ url: '/public/petition/dicts', method: 'get' })
}
