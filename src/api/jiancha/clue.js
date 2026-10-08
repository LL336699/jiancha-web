import request from '@/utils/request'

// 查询问题线索列表
export function listClue(query) {
  return request({ url: '/jiancha/clue/list', method: 'get', params: query })
}

// 查询线索详情
export function getClue(clueId) {
  return request({ url: '/jiancha/clue/' + clueId, method: 'get' })
}

// 新增线索
export function addClue(data) {
  return request({ url: '/jiancha/clue', method: 'post', data: data })
}

// 修改线索
export function updateClue(data) {
  return request({ url: '/jiancha/clue', method: 'put', data: data })
}

// 删除线索
export function delClue(clueIds) {
  return request({ url: '/jiancha/clue/' + clueIds, method: 'delete' })
}

// 线索流转（受理/研判/分办/处置/办结/退回/不予受理）
export function handleClue(clueId, data) {
  return request({ url: '/jiancha/clue/handle/' + clueId, method: 'post', data: data })
}

// 线索办理轨迹
export function getClueTrace(clueId) {
  return request({ url: '/jiancha/clue/trace/' + clueId, method: 'get' })
}

// 重复线索检测
export function detectDuplicate(params) {
  return request({ url: '/jiancha/clue/duplicate', method: 'get', params: params })
}

// 预览下一个线索编号
export function getNextClueNo() {
  return request({ url: '/jiancha/clue/nextNo', method: 'get' })
}

// 统计总览
export function clueStatOverview() {
  return request({ url: '/jiancha/clue/stat/overview', method: 'get' })
}

// 手动刷新红黄灯预警
export function refreshClueWarn() {
  return request({ url: '/jiancha/clue/refreshWarn', method: 'post' })
}
