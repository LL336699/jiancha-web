import request from '@/utils/request'

// 查询知识库分类列表
export function listKbCategory(query) {
  return request({
    url: '/jiancha/kb/category/list',
    method: 'get',
    params: query
  })
}

// 查询知识库分类树
export function treeKbCategory() {
  return request({
    url: '/jiancha/kb/category/tree',
    method: 'get'
  })
}

// 查询知识库分类详情
export function getKbCategory(categoryId) {
  return request({
    url: '/jiancha/kb/category/' + categoryId,
    method: 'get'
  })
}

// 新增知识库分类
export function addKbCategory(data) {
  return request({
    url: '/jiancha/kb/category',
    method: 'post',
    data: data
  })
}

// 修改知识库分类
export function updateKbCategory(data) {
  return request({
    url: '/jiancha/kb/category',
    method: 'put',
    data: data
  })
}

// 删除知识库分类
export function delKbCategory(categoryId) {
  return request({
    url: '/jiancha/kb/category/' + categoryId,
    method: 'delete'
  })
}
