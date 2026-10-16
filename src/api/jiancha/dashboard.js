import request from '@/utils/request'

// 基础看板总览（P6 M8：线索/知识库等核心指标）
export function getDashboard() {
  return request({
    url: '/jiancha/dashboard/overview',
    method: 'get'
  })
}

// ============ 段12 纪检综合看板（增强）============

/** 综合看板（八大模块汇总 + 红黄绿灯 + 当日快照） */
export function getComprehensive() {
  return request({ url: '/jiancha/dashboard/comprehensive', method: 'get' })
}

/** 模块运行统计 */
export function getModuleStats() {
  return request({ url: '/jiancha/dashboard/modules', method: 'get' })
}

/** 模块红黄绿灯 */
export function getDashboardLights() {
  return request({ url: '/jiancha/dashboard/lights', method: 'get' })
}

/** 历史快照列表 */
export function getSnapshots() {
  return request({ url: '/jiancha/dashboard/snapshots', method: 'get' })
}

/** 立即生成/更新当日快照 */
export function refreshSnapshot() {
  return request({ url: '/jiancha/dashboard/snapshot/refresh', method: 'post' })
}

/** 快照环比对比（最新 vs 一周前） */
export function compareSnapshot() {
  return request({ url: '/jiancha/dashboard/snapshot/compare', method: 'get' })
}

/** 模块月度趋势（petition/rectify/reply/conduct/risk） */
export function getModuleTrend(module) {
  return request({ url: '/jiancha/dashboard/trend', method: 'get', params: { module } })
}

/** 模块状态分布（asset/supplier/edu） */
export function getModuleStatus(module) {
  return request({ url: '/jiancha/dashboard/status', method: 'get', params: { module } })
}

/** 跨模块超期事项清单（module 为空返回全部） */
export function getOverdueItems(module) {
  return request({ url: '/jiancha/dashboard/overdue', method: 'get', params: { module } })
}

/** 部门办理效能 */
export function getDeptWorkload() {
  return request({ url: '/jiancha/dashboard/dept', method: 'get' })
}

/** 模块健康评分（0-100） */
export function getModuleHealth() {
  return request({ url: '/jiancha/dashboard/health', method: 'get' })
}

/** 预警规则列表 */
export function listAlertRules() {
  return request({ url: '/jiancha/dashboard/alerts', method: 'get' })
}

/** 新增预警规则 */
export function addAlertRule(data) {
  return request({ url: '/jiancha/dashboard/alerts', method: 'post', data })
}

/** 修改预警规则 */
export function updateAlertRule(data) {
  return request({ url: '/jiancha/dashboard/alerts', method: 'put', data })
}

/** 删除预警规则 */
export function delAlertRule(ruleId) {
  return request({ url: '/jiancha/dashboard/alerts/' + ruleId, method: 'delete' })
}

/** 预警规则评估（对照当前数据命中情况） */
export function evaluateAlerts() {
  return request({ url: '/jiancha/dashboard/alerts/evaluate', method: 'get' })
}

/** 导出综合看板数据（XLSX 多 Sheet） */
export function exportComprehensive() {
  return request({
    url: '/jiancha/dashboard/export',
    method: 'get',
    responseType: 'blob'
  })
}
