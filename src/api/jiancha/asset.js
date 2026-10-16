import request from '@/utils/request'

// ============ 涉案财物管理（asset）============

/** 财物列表（分页 + 条件） */
export function listAsset(query) {
  return request({ url: '/jiancha/asset/list', method: 'get', params: query })
}

/** 财物详情（按主键） */
export function getAsset(assetId) {
  return request({ url: '/jiancha/asset/' + assetId, method: 'get' })
}

/** 财物详情（按编号） */
export function getAssetByNo(assetNo) {
  return request({ url: '/jiancha/asset/no/' + assetNo, method: 'get' })
}

/** 财物流转流水 */
export function listAssetFlows(assetId) {
  return request({ url: '/jiancha/asset/flows/' + assetId, method: 'get' })
}

/** 统计 */
export function statAsset() {
  return request({ url: '/jiancha/asset/stat', method: 'get' })
}

/** 人员检索（登记时选人） */
export function searchAssetPersons(keyword) {
  return request({ url: '/jiancha/asset/persons', method: 'get', params: { keyword } })
}

/** 登记财物 */
export function addAsset(data) {
  return request({ url: '/jiancha/asset', method: 'post', data })
}

/** 批量登记财物 */
export function addAssetBatch(data) {
  return request({ url: '/jiancha/asset/batch', method: 'post', data })
}

/** 修改财物 */
export function updateAsset(data) {
  return request({ url: '/jiancha/asset', method: 'put', data })
}

/** 删除财物 */
export function delAsset(assetId) {
  return request({ url: '/jiancha/asset/' + assetId, method: 'delete' })
}

/** 入库登记（0 → 1：保管人/存放地点） */
export function storeAsset(assetId, data) {
  return request({ url: '/jiancha/asset/store/' + assetId, method: 'post', data })
}

/** 交接（1 → 1：移交他人保管，留痕） */
export function handoverAsset(assetId, data) {
  return request({ url: '/jiancha/asset/handover/' + assetId, method: 'post', data })
}

/** 处置申请（→ 2：处置方式/期限/说明） */
export function disposeApplyAsset(assetId, data) {
  return request({ url: '/jiancha/asset/disposeApply/' + assetId, method: 'post', data })
}

/** 处置完成（2 → 3：处置日期/凭证/说明） */
export function disposeDoneAsset(assetId, data) {
  return request({ url: '/jiancha/asset/disposeDone/' + assetId, method: 'post', data })
}

/** 退还（→ 4：退还日期/凭证/说明） */
export function refundAsset(assetId, data) {
  return request({ url: '/jiancha/asset/refund/' + assetId, method: 'post', data })
}
