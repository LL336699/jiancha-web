import request from '@/utils/request'

// ============ 预警管理 ============

// 查询预警列表（分页）
export function listRiskAlert(query) {
  return request({ url: '/jiancha/risk/alert/list', method: 'get', params: query })
}

// 查询预警详情
export function getRiskAlert(alertId) {
  return request({ url: '/jiancha/risk/alert/' + alertId, method: 'get' })
}

// 手动登记预警
export function addRiskAlert(data) {
  return request({ url: '/jiancha/risk/alert', method: 'post', data: data })
}

// 核实预警（confirm 确认转整改 / exclude 排除 / archive 归档）
export function verifyRiskAlert(alertId, data) {
  return request({ url: '/jiancha/risk/alert/verify', method: 'post', params: { alertId }, data: data })
}

// 手动触发引擎扫描
export function scanRiskAlert() {
  return request({ url: '/jiancha/risk/alert/scan', method: 'post' })
}

// 统计与三级风险视图
export function riskStat() {
  return request({ url: '/jiancha/risk/stat', method: 'get' })
}

// ============ 规则配置 ============

// 规则列表
export function listRiskRule(query) {
  return request({ url: '/jiancha/risk/rule/list', method: 'get', params: query })
}

// 规则详情
export function getRiskRule(ruleId) {
  return request({ url: '/jiancha/risk/rule/' + ruleId, method: 'get' })
}

// 新增规则
export function addRiskRule(data) {
  return request({ url: '/jiancha/risk/rule', method: 'post', data: data })
}

// 修改规则
export function updateRiskRule(data) {
  return request({ url: '/jiancha/risk/rule', method: 'put', data: data })
}

// 删除规则
export function delRiskRule(ruleId) {
  return request({ url: '/jiancha/risk/rule/' + ruleId, method: 'delete' })
}

// ============ 岗位风险模型 ============

// 模型行列表
export function listRiskModel(query) {
  return request({ url: '/jiancha/risk/model/list', method: 'get', params: query })
}

// 岗位权重汇总（三级视图-岗位层）
export function positionWeight() {
  return request({ url: '/jiancha/risk/model/position', method: 'get' })
}

// 新增模型行
export function addRiskModel(data) {
  return request({ url: '/jiancha/risk/model', method: 'post', data: data })
}

// 修改模型行
export function updateRiskModel(data) {
  return request({ url: '/jiancha/risk/model', method: 'put', data: data })
}

// 删除模型行
export function delRiskModel(modelId) {
  return request({ url: '/jiancha/risk/model/' + modelId, method: 'delete' })
}
