import request from '@/utils/request'

// ============ 供应商档案 ============

// 查询供应商列表（分页）
export function listSupplier(query) {
  return request({ url: '/jiancha/supplier/list', method: 'get', params: query })
}

// 查询供应商详情
export function getSupplier(supplierId) {
  return request({ url: '/jiancha/supplier/' + supplierId, method: 'get' })
}

// 新增供应商（初始状态=待审查）
export function addSupplier(data) {
  return request({ url: '/jiancha/supplier', method: 'post', data: data })
}

// 修改供应商
export function updateSupplier(data) {
  return request({ url: '/jiancha/supplier', method: 'put', data: data })
}

// 删除供应商（仅待审查状态可删）
export function delSupplier(supplierId) {
  return request({ url: '/jiancha/supplier/' + supplierId, method: 'delete' })
}

// 准入审查：auditResult=pass 正常 / observe 观察 / deny 禁入
export function auditSupplier(supplierId, data) {
  return request({ url: '/jiancha/supplier/audit/' + supplierId, method: 'post', data: data })
}

// ============ 黑名单 ============

// 拉黑（blackReason 必填，blackDays 可空=永久）
export function blackSupplier(supplierId, data) {
  return request({ url: '/jiancha/supplier/black/' + supplierId, method: 'post', data: data })
}

// 黑名单列表（分页）
export function listBlack(query) {
  return request({ url: '/jiancha/supplier/black/list', method: 'get', params: query })
}

// 黑名单详情
export function getBlack(blackId) {
  return request({ url: '/jiancha/supplier/black/' + blackId, method: 'get' })
}

// 按供应商查黑名单沿革
export function blackBySupplier(supplierId) {
  return request({ url: '/jiancha/supplier/black/bySupplier/' + supplierId, method: 'get' })
}

// 解除黑名单（opinion 必填）
export function liftBlack(blackId, data) {
  return request({ url: '/jiancha/supplier/black/lift/' + blackId, method: 'post', data: data })
}

// ============ 廉洁协议 ============

// 协议列表（分页）
export function listAgreement(query) {
  return request({ url: '/jiancha/supplier/agreement/list', method: 'get', params: query })
}

// 协议详情
export function getAgreement(agreementId) {
  return request({ url: '/jiancha/supplier/agreement/' + agreementId, method: 'get' })
}

// 按供应商查协议
export function agreementBySupplier(supplierId) {
  return request({ url: '/jiancha/supplier/agreement/bySupplier/' + supplierId, method: 'get' })
}

// 签署协议
export function addAgreement(data) {
  return request({ url: '/jiancha/supplier/agreement', method: 'post', data: data })
}

// 续签协议（newExpireDate 必填）
export function renewAgreement(agreementId, data) {
  return request({ url: '/jiancha/supplier/agreement/renew/' + agreementId, method: 'post', data: data })
}

// 解除协议
export function liftAgreement(agreementId) {
  return request({ url: '/jiancha/supplier/agreement/lift/' + agreementId, method: 'post' })
}

// 删除协议
export function delAgreement(agreementId) {
  return request({ url: '/jiancha/supplier/agreement/' + agreementId, method: 'delete' })
}

// ============ 关联排查 ============

// 关联排查列表（分页）
export function listLink(query) {
  return request({ url: '/jiancha/supplier/link/list', method: 'get', params: query })
}

// 关联排查详情
export function getLink(linkId) {
  return request({ url: '/jiancha/supplier/link/' + linkId, method: 'get' })
}

// 按供应商查关联
export function linkBySupplier(supplierId) {
  return request({ url: '/jiancha/supplier/link/bySupplier/' + supplierId, method: 'get' })
}

// 登记关联线索
export function addLink(data) {
  return request({ url: '/jiancha/supplier/link', method: 'post', data: data })
}

// 关联处置（handleResult=confirm 确认 / exclude 排除）
export function handleLink(linkId, data) {
  return request({ url: '/jiancha/supplier/link/handle/' + linkId, method: 'post', data: data })
}

// 关联转整改（生成 E3 整改问题）
export function linkToRectify(linkId, data) {
  return request({ url: '/jiancha/supplier/link/toRectify/' + linkId, method: 'post', data: data })
}

// 系统比对扫描（与人员利益冲突申报库自动比对）
export function scanLink() {
  return request({ url: '/jiancha/supplier/link/scan', method: 'post' })
}

// ============ 统计 ============

// 廉洁管理统计（档案/协议/黑名单/关联）
export function supplierStat() {
  return request({ url: '/jiancha/supplier/stat', method: 'get' })
}
