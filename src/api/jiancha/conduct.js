import request from '@/utils/request'

// ============ 作风建设问题（conduct）============

/** 登记问题 */
export function addConduct(data) {
  return request({ url: '/jiancha/conduct', method: 'post', data })
}

/** 问题列表（分页） */
export function listConduct(query) {
  return request({ url: '/jiancha/conduct/list', method: 'get', params: query })
}

/** 问题详情（按主键） */
export function getConduct(issueId) {
  return request({ url: '/jiancha/conduct/' + issueId, method: 'get' })
}

/** 问题详情（按编号） */
export function getConductByNo(issueNo) {
  return request({ url: '/jiancha/conduct/no/' + issueNo, method: 'get' })
}

/** 修改问题 */
export function updateConduct(data) {
  return request({ url: '/jiancha/conduct', method: 'put', data })
}

/** 删除问题 */
export function delConduct(issueId) {
  return request({ url: '/jiancha/conduct/' + issueId, method: 'delete' })
}

/** 核查（0 → 1：填写违规事实/涉及金额/严重度） */
export function verifyConduct(issueId, data) {
  return request({ url: '/jiancha/conduct/verify/' + issueId, method: 'post', data })
}

/** 处理（1 → 2：填写处理方式/日期/说明/退缴额） */
export function handleConduct(issueId, data) {
  return request({ url: '/jiancha/conduct/handle/' + issueId, method: 'post', data })
}

/** 转整改（生成整改台账，issueId → rectifyId） */
export function transferConductRectify(issueId, data) {
  return request({ url: '/jiancha/conduct/transferRectify/' + issueId, method: 'post', data })
}

/** 转处分（生成处分记录，issueId → punishId） */
export function transferConductPunish(issueId, data) {
  return request({ url: '/jiancha/conduct/transferPunish/' + issueId, method: 'post', data })
}

/** 关闭问题（→ 3） */
export function closeConduct(issueId, data) {
  return request({ url: '/jiancha/conduct/close/' + issueId, method: 'post', data })
}

/** 作废问题（→ 4） */
export function cancelConduct(issueId, data) {
  return request({ url: '/jiancha/conduct/cancel/' + issueId, method: 'post', data })
}

/** 恢复（4 → 0） */
export function recoveryConduct(issueId) {
  return request({ url: '/jiancha/conduct/recovery/' + issueId, method: 'post' })
}

/** 登记退缴明细（多笔退缴，自动汇总主表退缴额） */
export function addConductRecovery(issueId, data) {
  return request({ url: '/jiancha/conduct/recovery/' + issueId, method: 'post', data })
}

/** 退缴明细列表（按问题） */
export function listConductRecoveries(issueId) {
  return request({ url: '/jiancha/conduct/recovery/' + issueId, method: 'get' })
}

/** 删除退缴登记（同步重算主表退缴额） */
export function delConductRecovery(recoveryId) {
  return request({ url: '/jiancha/conduct/recovery/' + recoveryId, method: 'delete' })
}

/** 人员检索（登记时选人） */
export function searchConductPersons(keyword) {
  return request({ url: '/jiancha/conduct/persons', method: 'get', params: { keyword } })
}

/** 统计 */
export function statConduct() {
  return request({ url: '/jiancha/conduct/stat', method: 'get' })
}
