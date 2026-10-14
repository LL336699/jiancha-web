import request from '@/utils/request'

// 查询问题列表（分页）
export function listRectifyIssue(query) {
  return request({ url: '/jiancha/rectify/list', method: 'get', params: query })
}

// 查询问题详情
export function getRectifyIssue(issueId) {
  return request({ url: '/jiancha/rectify/' + issueId, method: 'get' })
}

// 登记问题（幂等：同 sourceRef 返回既有）
export function addRectifyIssue(data) {
  return request({ url: '/jiancha/rectify', method: 'post', data: data })
}

// 从舞弊举报一键登记整改问题
export function addRectifyFromPetition(petitionId, targetDeptId, problemType, severity) {
  return request({
    url: '/jiancha/rectify/fromPetition',
    method: 'post',
    params: { petitionId, targetDeptId, problemType, severity }
  })
}

// 修改问题
export function updateRectifyIssue(data) {
  return request({ url: '/jiancha/rectify', method: 'put', data: data })
}

// 删除问题（级联措施与复核记录）
export function delRectifyIssue(issueId) {
  return request({ url: '/jiancha/rectify/' + issueId, method: 'delete' })
}

// 办理流转（start/submit/pass/reopen/revisit/void）
export function handleRectifyIssue(issueId, data) {
  return request({ url: '/jiancha/rectify/action', method: 'post', params: { issueId }, data: data })
}

// ============ 整改措施 ============

// 措施列表
export function listRectifyTask(issueId) {
  return request({ url: '/jiancha/rectify/task/' + issueId, method: 'get' })
}

// 新增措施
export function addRectifyTask(data) {
  return request({ url: '/jiancha/rectify/task', method: 'post', data: data })
}

// 更新措施
export function updateRectifyTask(data) {
  return request({ url: '/jiancha/rectify/task', method: 'put', data: data })
}

// 删除措施
export function delRectifyTask(taskId) {
  return request({ url: '/jiancha/rectify/task/' + taskId, method: 'delete' })
}

// ============ 复核记录 ============

// 复核/回头看记录
export function listRectifyReview(issueId) {
  return request({ url: '/jiancha/rectify/review/' + issueId, method: 'get' })
}

// 整改统计
export function rectifyStat() {
  return request({ url: '/jiancha/rectify/stat', method: 'get' })
}
