import request from '@/utils/request'

// 查询廉洁档案人员列表
export function listPerson(query) {
  return request({ url: '/jiancha/archive/person/list', method: 'get', params: query })
}

// 查询人员详细
export function getPerson(personId) {
  return request({ url: '/jiancha/archive/person/' + personId, method: 'get' })
}

// 新增人员
export function addPerson(data) {
  return request({ url: '/jiancha/archive/person', method: 'post', data: data })
}

// 修改人员
export function updatePerson(data) {
  return request({ url: '/jiancha/archive/person', method: 'put', data: data })
}

// 删除人员
export function delPerson(personIds) {
  return request({ url: '/jiancha/archive/person/' + personIds, method: 'delete' })
}

// 画像标签（可溯源）
export function listTagByPerson(personId) {
  return request({ url: '/jiancha/archive/tag/byPerson/' + personId, method: 'get' })
}

// 任职经历
export function listCareerByPerson(personId) {
  return request({ url: '/jiancha/archive/career/byPerson/' + personId, method: 'get' })
}

// 关联关系（企业口径）
export function listRelationByPerson(personId) {
  return request({ url: '/jiancha/archive/relation/byPerson/' + personId, method: 'get' })
}

// 处分记录
export function listPunishByPerson(personId) {
  return request({ url: '/jiancha/archive/punish/byPerson/' + personId, method: 'get' })
}

// 利益冲突申报（按人）
export function listDeclareByPerson(personId) {
  return request({ url: '/jiancha/archive/declare/byPerson/' + personId, method: 'get' })
}

// 风险预警：只读评估
export function evaluateRisk(personId) {
  return request({ url: '/jiancha/archive/risk/evaluate/' + personId, method: 'get' })
}

// 风险预警：评估并写回（更新风险等级/廉洁评分/派生标签）
export function applyRisk(personId) {
  return request({ url: '/jiancha/archive/risk/apply/' + personId, method: 'post' })
}
