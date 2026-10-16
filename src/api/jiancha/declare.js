import request from '@/utils/request'

// ==================== 申报单 ====================

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

// 核实申报（后端自动写核实人与时间）
export function verifyDeclare(data) {
  return request({ url: '/jiancha/archive/declare/verify', method: 'put', data: data })
}

// 删除申报
export function delDeclare(declareIds) {
  return request({ url: '/jiancha/archive/declare/' + declareIds, method: 'delete' })
}

// 按人员查询申报记录
export function listDeclareByPerson(personId) {
  return request({ url: '/jiancha/archive/declare/byPerson/' + personId, method: 'get' })
}

// 段15：年度申报统计（看板）
export function statDeclare(year) {
  return request({ url: '/jiancha/archive/declare/stat', method: 'get', params: { year } })
}

// 段15：该年度无任何申报的在岗人员（集中申报督办）
export function listUnDeclared(year) {
  return request({ url: '/jiancha/archive/declare/unDeclared', method: 'get', params: { year } })
}

// 段15：按人员维度聚合（重点关注人员 Top10）
export function personStat(year) {
  return request({ url: '/jiancha/archive/declare/personStat', method: 'get', params: { year } })
}

// 段15：年度申报清单导出
export function exportDeclare(year) {
  return request({ url: '/jiancha/archive/declare/export', method: 'post', params: { year }, responseType: 'blob' })
}

// ==================== 年度集中申报截止配置（段15） ====================

// 查询配置列表
export function listDeclareConfig(query) {
  return request({ url: '/jiancha/archive/declareConfig/list', method: 'get', params: query })
}

// 查询配置详细
export function getDeclareConfig(configId) {
  return request({ url: '/jiancha/archive/declareConfig/' + configId, method: 'get' })
}

// 新增配置
export function addDeclareConfig(data) {
  return request({ url: '/jiancha/archive/declareConfig', method: 'post', data: data })
}

// 修改配置
export function updateDeclareConfig(data) {
  return request({ url: '/jiancha/archive/declareConfig', method: 'put', data: data })
}

// 删除配置
export function delDeclareConfig(configIds) {
  return request({ url: '/jiancha/archive/declareConfig/' + configIds, method: 'delete' })
}

// ==================== 申报事项明细 ====================

// 申报事项明细（按申报单）
export function listItemByDeclare(declareId) {
  return request({ url: '/jiancha/archive/declareItem/byDeclare/' + declareId, method: 'get' })
}

// 事项明细分页（RuoYi 标准）
export function listItem(query) {
  return request({ url: '/jiancha/archive/declareItem/list', method: 'get', params: query })
}

// 新增事项
export function addItem(data) {
  return request({ url: '/jiancha/archive/declareItem', method: 'post', data: data })
}

// 修改事项
export function updateItem(data) {
  return request({ url: '/jiancha/archive/declareItem', method: 'put', data: data })
}

// 删除事项
export function delItem(itemIds) {
  return request({ url: '/jiancha/archive/declareItem/' + itemIds, method: 'delete' })
}

// 段15：批量插入事项（declareId 走路径）
export function batchAddItems(declareId, items) {
  return request({ url: '/jiancha/archive/declareItem/batch/' + declareId, method: 'post', data: items })
}

// 段15：按申报单全量替换事项（事务内先删后插）
export function replaceItems(declareId, items) {
  return request({ url: '/jiancha/archive/declareItem/replace/' + declareId, method: 'put', data: items })
}

// 段15：申报单变更留痕（时间正序）
export function listDeclareLog(declareId) {
  return request({ url: '/jiancha/archive/declare/log/' + declareId, method: 'get' })
}

// 段15：未申报人员督办清单导出
export function exportUnDeclared(year) {
  return request({ url: '/jiancha/archive/declare/exportUnDeclared', method: 'post', params: { year }, responseType: 'blob' })
}

// 段15：按申报单导出事项明细（含黑名单命中列）
export function exportItems(declareId) {
  return request({ url: '/jiancha/archive/declareItem/export/' + declareId, method: 'post', responseType: 'blob' })
}
