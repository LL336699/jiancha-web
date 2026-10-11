import request from '@/utils/request'

// 查询知识库文档列表
export function listKbDoc(query) {
  return request({
    url: '/jiancha/kb/doc/list',
    method: 'get',
    params: query
  })
}

// 知识库概览统计
export function kbDocOverview() {
  return request({
    url: '/jiancha/kb/doc/overview',
    method: 'get'
  })
}

// 查询知识库文档详情
export function getKbDoc(docId) {
  return request({
    url: '/jiancha/kb/doc/' + docId,
    method: 'get'
  })
}

// 查看文档分块（核对分块质量与出处）
export function getKbDocChunks(docId) {
  return request({
    url: '/jiancha/kb/doc/' + docId + '/chunks',
    method: 'get'
  })
}

// 上传并入库（解析 + 分块 + 向量化）
export function uploadKbDoc(file, categoryId, doc) {
  const formData = new FormData()
  formData.append('file', file)
  if (categoryId !== undefined && categoryId !== null) {
    formData.append('categoryId', categoryId)
  }
  if (doc) {
    Object.keys(doc).forEach(key => {
      if (doc[key] !== undefined && doc[key] !== null && doc[key] !== '') {
        formData.append(key, doc[key])
      }
    })
  }
  return request({
    url: '/jiancha/kb/doc/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000
  })
}

// 修改文档元数据
export function updateKbDoc(data) {
  return request({
    url: '/jiancha/kb/doc',
    method: 'put',
    data: data
  })
}

// 重新解析入库
export function reingestKbDoc(docId) {
  return request({
    url: '/jiancha/kb/doc/reingest/' + docId,
    method: 'post',
    timeout: 300000
  })
}

// 删除文档
export function delKbDoc(docId) {
  return request({
    url: '/jiancha/kb/doc/' + docId,
    method: 'delete'
  })
}
