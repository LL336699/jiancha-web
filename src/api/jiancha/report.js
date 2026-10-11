import request from '@/utils/request'

// 文书模板列表
export function listReportTemplate(query) {
  return request({ url: '/jiancha/report/template/list', method: 'get', params: query })
}

// 文书模板详情
export function getReportTemplate(id) {
  return request({ url: '/jiancha/report/template/' + id, method: 'get' })
}

// 生成文书草稿 + 量纪建议
export function genReport(data) {
  return request({ url: '/jiancha/report/generate', method: 'post', data })
}

// 生成记录列表
export function listReportRecord(query) {
  return request({ url: '/jiancha/report/record/list', method: 'get', params: query })
}

// 生成记录详情
export function getReportRecord(id) {
  return request({ url: '/jiancha/report/record/' + id, method: 'get' })
}
