import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// AI 底座状态（LLM 供应商 / 就绪状态 / 向量库可用性）
export function kbChatStatus() {
  return request({
    url: '/jiancha/kb/chat/status',
    method: 'get'
  })
}

// 非流式问答
export function kbAsk(data) {
  return request({
    url: '/jiancha/kb/chat/ask',
    method: 'post',
    data: data,
    timeout: 180000
  })
}

// 纯检索（不调 LLM）
export function kbSearch(query, categoryId) {
  return request({
    url: '/jiancha/kb/chat/search',
    method: 'get',
    params: { query: query, categoryId: categoryId }
  })
}

// 清空会话记忆
export function kbClearSession(sessionId) {
  return request({
    url: '/jiancha/kb/chat/clear',
    method: 'post',
    params: { sessionId: sessionId }
  })
}

/**
 * 流式问答（SSE）。
 *
 * 后端为 GET /jiancha/kb/chat/stream + query 参数，事件名：
 *   citations —— 出处列表（JSON 字符串，先发）
 *   message   —— 增量正文
 *   done      —— 结束
 *   error     —— 异常信息
 *
 * 【为何用 fetch 而非 EventSource】
 * 后端 TokenService 仅从 HTTP Header 读取 token（不支持 query 传参），
 * 而原生 EventSource 无法自定义请求头。故此处用 fetch + ReadableStream
 * 手工解析 SSE 报文，既能携带 Authorization，又保持流式。
 *
 * @param {Object} params   { question, categoryId, sessionId }
 * @param {Object} handlers { onCitations, onMessage, onDone, onError }
 * @returns {Object} 控制器 { abort() }
 */
export function kbAskStream(params, handlers) {
  const baseUrl = import.meta.env.VITE_APP_BASE_API || ''
  const qs = new URLSearchParams()
  qs.append('question', params.question)
  if (params.categoryId !== undefined && params.categoryId !== null) {
    qs.append('categoryId', params.categoryId)
  }
  if (params.sessionId) {
    qs.append('sessionId', params.sessionId)
  }
  const url = `${baseUrl}/jiancha/kb/chat/stream?${qs.toString()}`

  const controller = new AbortController()
  const token = getToken()
  const headers = { Accept: 'text/event-stream' }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }

  let finished = false
  const finish = () => {
    if (!finished) {
      finished = true
      handlers.onDone && handlers.onDone()
    }
  }

  fetch(url, { method: 'GET', headers, signal: controller.signal })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`HTTP ${response.status} ${text || ''}`)
        })
      }
      if (!response.body) {
        throw new Error('当前浏览器不支持流式响应')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      const pump = () => reader.read().then(({ done, value }) => {
        if (done) {
          finish()
          return
        }
        buffer += decoder.decode(value, { stream: true })
        // SSE 以空行分隔事件块
        const blocks = buffer.split(/\r?\n\r?\n/)
        buffer = blocks.pop()
        blocks.forEach(block => dispatchSseBlock(block, handlers))
        return pump()
      })

      return pump()
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        finish()
        return
      }
      handlers.onError && handlers.onError(err.message || String(err))
      finish()
    })

  return {
    abort() {
      try {
        controller.abort()
      } catch (e) {
        // 忽略
      }
    }
  }
}

/** 解析单个 SSE 事件块（可能含多行 data:） */
function dispatchSseBlock(block, handlers) {
  if (!block || !block.trim()) {
    return
  }
  let eventName = 'message'
  const dataLines = []
  block.split(/\r?\n/).forEach(line => {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      // 去掉 "data:" 与其后的一个空格
      let d = line.slice(5)
      if (d.startsWith(' ')) {
        d = d.slice(1)
      }
      dataLines.push(d)
    }
  })
  const data = dataLines.join('\n')

  switch (eventName) {
    case 'citations':
      try {
        handlers.onCitations && handlers.onCitations(JSON.parse(data))
      } catch (e) {
        handlers.onCitations && handlers.onCitations([])
      }
      break
    case 'message':
      handlers.onMessage && handlers.onMessage(data)
      break
    case 'error':
      handlers.onError && handlers.onError(data)
      break
    case 'done':
      handlers.onDone && handlers.onDone()
      break
    default:
      if (data) {
        handlers.onMessage && handlers.onMessage(data)
      }
  }
}
