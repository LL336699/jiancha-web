import request from '@/utils/request'

// 查询利益冲突申报列表
export function listDeclare(query) {
  return request({ url: '/jiancha/archive/declare/list', method: 'get', params: query })
}

// 查询申报详细
export function getDeclare(declareId) {
  return request({ url: '/jiancha/archive/declare/' + declareId, method: 'get' })
}

// 新增申报
export function addDeclare(data) {
  return request({ url: '/jiancha/archive/declare', method: 'post', data: data })
}

// 修改申报
export function updateDeclare(data) {
  return request({ url: '/jiancha/archive/declare', method: 'put', data: data })
}

// 核实申报
export function verifyDeclare(data) {
  return request({ url: '/jiancha/archive/declare/verify', method: 'put', data: data })
}

// 删除申报
export function delDeclare(declareIds) {
  return request({ url: '/jiancha/archive/declare/' + declareIds, method: 'delete' })
}

// 申报事项明细（按申报单）
export function listItemByDeclare(declareId) {
  return request({ url: '/jiancha/archive/declareItem/byDeclare/' + declareId, method: 'get' })
}
