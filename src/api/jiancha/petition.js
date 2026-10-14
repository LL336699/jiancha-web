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
