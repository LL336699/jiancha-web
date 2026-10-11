import request from '@/utils/request'

// 数据看板总览
export function getDashboard() {
  return request({
    url: '/jiancha/dashboard/overview',
    method: 'get'
  })
}
