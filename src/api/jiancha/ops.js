import request from '@/utils/request'

// ============ 系统健康巡检（段17 全局打磨） ============

// 一键巡检（数据层/缓存层/AI 能力/定时任务/业务待办）
export function checkHealth() {
  return request({ url: '/jiancha/ops/health', method: 'get' })
}
