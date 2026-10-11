<template>
  <div class="app-container kb-chat">
    <el-row :gutter="12" style="height: calc(100vh - 140px);">
      <!-- ═══ 左：会话区 ═══ -->
      <el-col :span="17" class="chat-col">
        <el-card shadow="never" class="chat-card">
          <template #header>
            <div class="chat-header">
              <div class="chat-title">
                <el-icon><ChatDotRound /></el-icon>
                <span>知识库智能问答</span>
                <el-tag v-if="status.llmReady" type="success" size="small" effect="plain">模型就绪</el-tag>
                <el-tag v-else type="info" size="small" effect="plain">未启用模型（仅检索）</el-tag>
                <el-tag v-if="status.vectorReady" type="success" size="small" effect="plain">向量检索</el-tag>
                <el-tag v-else type="warning" size="small" effect="plain">关键词检索</el-tag>
              </div>
              <div>
                <el-button link type="info" icon="Delete" @click="clearChat">清空对话</el-button>
              </div>
            </div>
          </template>

          <!-- 消息区 -->
          <div ref="msgBoxRef" class="msg-box">
            <el-empty v-if="messages.length === 0" description="请输入问题，系统将基于知识库条文作答并标注出处" />

            <div v-for="(m, idx) in messages" :key="idx" :class="['msg', m.role === 'user' ? 'msg-user' : 'msg-ai']">
              <div class="msg-avatar">
                <el-icon v-if="m.role === 'user'"><User /></el-icon>
                <el-icon v-else><Cpu /></el-icon>
              </div>
              <div class="msg-body">
                <div class="msg-content" v-html="renderContent(m.content, m.role)"></div>

                <!-- 出处卡片 -->
                <div v-if="m.citations && m.citations.length" class="citation-list">
                  <div class="citation-title">参考依据（{{ m.citations.length }}）</div>
                  <div v-for="c in m.citations" :key="c.chunkId" class="citation-item">
                    <div class="citation-head">
                      <el-tag size="small" type="primary" effect="plain">{{ c.index }}</el-tag>
                      <span class="citation-src">{{ c.citation }}</span>
                      <el-tag size="small" type="info" effect="plain" class="citation-score">
                        相关度 {{ c.score }}
                      </el-tag>
                    </div>
                    <div class="citation-excerpt">{{ c.excerpt }}</div>
                  </div>
                </div>

                <div v-if="m.llmError" class="msg-warn">模型调用失败，已降级返回检索原文：{{ m.llmError }}</div>
                <div v-if="m.streaming" class="msg-cursor">▋</div>
              </div>
            </div>
          </div>

          <!-- 输入区 -->
          <div class="input-area">
            <el-input
              v-model="question"
              type="textarea"
              :rows="2"
              resize="none"
              placeholder="请输入问题，例如：采购环节收受回扣应当如何处理？（Enter 发送，Shift+Enter 换行）"
              @keydown.enter.exact.prevent="send"
            />
            <div class="input-actions">
              <el-select v-model="categoryId" placeholder="全库检索" clearable size="small" style="width: 180px">
                <el-option v-for="c in flatCategories" :key="c.categoryId" :label="c.label" :value="c.categoryId" />
              </el-select>
              <el-select v-model="mode" size="small" style="width: 130px">
                <el-option label="流式回答" value="stream" />
                <el-option label="完整回答" value="sync" />
              </el-select>
              <el-button type="primary" :loading="sending" @click="send">发送</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- ═══ 右：检索预览 ═══ -->
      <el-col :span="7" class="side-col">
        <el-card shadow="never" class="side-card">
          <template #header>
            <div class="side-header">
              <span>检索原文预览</span>
              <el-button link type="primary" size="small" @click="doSearch">检索</el-button>
            </div>
          </template>
          <div class="side-search">
            <el-input v-model="previewQuery" placeholder="输入关键词，仅检索不调用模型" size="small" @keyup.enter="doSearch" />
          </div>
          <div class="side-body">
            <el-empty v-if="previewHits.length === 0" description="尚未检索" :image-size="60" />
            <div v-for="h in previewHits" :key="h.chunkId" class="hit-item">
              <div class="hit-head">
                <el-tag size="small" effect="plain">{{ h.source }}</el-tag>
                <span class="hit-src">{{ h.citation }}</span>
              </div>
              <div class="hit-content">{{ h.content }}</div>
              <div class="hit-score">相关度 {{ h.score }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="KbChat">
import { ref, computed, nextTick, onMounted, getCurrentInstance } from 'vue'
import { ChatDotRound, User, Cpu } from '@element-plus/icons-vue'
import { kbAsk, kbSearch, kbChatStatus, kbAskStream } from '@/api/jiancha/kbChat'
import { treeKbCategory } from '@/api/jiancha/kbCategory'

const { proxy } = getCurrentInstance()

const messages = ref([])
const question = ref('')
const categoryId = ref(undefined)
const mode = ref('stream')
const sending = ref(false)
const status = ref({})
const msgBoxRef = ref(null)
const categories = ref([])

const previewQuery = ref('')
const previewHits = ref([])

let streamCtrl = null
const sessionId = 'kb-' + Date.now()

const flatCategories = computed(() => {
  const out = []
  const walk = (list, prefix) => {
    (list || []).forEach(c => {
      out.push({ categoryId: c.categoryId, label: prefix + c.catName })
      if (c.children && c.children.length) {
        walk(c.children, prefix + c.catName + ' / ')
      }
    })
  }
  walk(categories.value, '')
  return out
})

function getStatus() {
  kbChatStatus().then(r => { status.value = r.data || {} })
}

function getCategories() {
  treeKbCategory().then(r => { categories.value = r.data || [] })
}

function scrollBottom() {
  nextTick(() => {
    if (msgBoxRef.value) {
      msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
    }
  })
}

function send() {
  const q = question.value.trim()
  if (!q) {
    return
  }
  messages.value.push({ role: 'user', content: q })
  question.value = ''
  scrollBottom()

  if (mode.value === 'stream') {
    sendStream(q)
  } else {
    sendSync(q)
  }
}

function sendSync(q) {
  sending.value = true
  const aiMsg = { role: 'ai', content: '', citations: [], streaming: true }
  messages.value.push(aiMsg)
  scrollBottom()

  kbAsk({ question: q, categoryId: categoryId.value, sessionId: sessionId }).then(r => {
    const d = r.data || {}
    aiMsg.content = d.answer || '（无回答）'
    aiMsg.citations = d.citations || []
    aiMsg.llmError = d.llmError
    aiMsg.streaming = false
    sending.value = false
    scrollBottom()
  }).catch(e => {
    aiMsg.content = '请求失败：' + (e.message || e)
    aiMsg.streaming = false
    sending.value = false
  })
}

function sendStream(q) {
  sending.value = true
  const aiMsg = { role: 'ai', content: '', citations: [], streaming: true }
  messages.value.push(aiMsg)
  scrollBottom()

  streamCtrl = kbAskStream(
    { question: q, categoryId: categoryId.value, sessionId: sessionId },
    {
      onCitations: list => {
        aiMsg.citations = list || []
        scrollBottom()
      },
      onMessage: text => {
        aiMsg.content += text
        scrollBottom()
      },
      onError: msg => {
        aiMsg.llmError = msg
      },
      onDone: () => {
        aiMsg.streaming = false
        sending.value = false
        if (!aiMsg.content) {
          aiMsg.content = '（未返回内容）'
        }
        scrollBottom()
      }
    }
  )
}

function clearChat() {
  if (streamCtrl) {
    try { streamCtrl.abort() } catch (e) {}
  }
  messages.value = []
  sending.value = false
}

function doSearch() {
  const q = previewQuery.value.trim()
  if (!q) {
    return
  }
  kbSearch(q, categoryId.value).then(r => {
    previewHits.value = r.data || []
  })
}

/** 极简 Markdown 渲染：换行 + 粗体，防止 XSS */
function renderContent(text, role) {
  if (!text) {
    return ''
  }
  if (role === 'user') {
    return escapeHtml(text).replace(/\n/g, '<br/>')
  }
  let s = escapeHtml(text)
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\n/g, '<br/>')
  return s
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

onMounted(() => {
  getStatus()
  getCategories()
})
</script>

<style scoped>
.kb-chat .chat-col, .kb-chat .side-col {
  height: 100%;
}
.chat-card, .side-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chat-card :deep(.el-card__body), .side-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.msg-box {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
}
.msg {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}
.msg-user .msg-avatar { background: #409eff; }
.msg-ai .msg-avatar { background: #67c23a; }
.msg-body {
  flex: 1;
  min-width: 0;
}
.msg-content {
  line-height: 1.75;
  padding: 10px 14px;
  border-radius: 8px;
  background: #f5f7fa;
  word-break: break-word;
}
.msg-user .msg-content {
  background: #ecf5ff;
}
.msg-warn {
  margin-top: 6px;
  font-size: 12px;
  color: #e6a23c;
}
.msg-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #67c23a;
}
@keyframes blink { 50% { opacity: 0; } }

.citation-list {
  margin-top: 10px;
  border-top: 1px dashed #dcdfe6;
  padding-top: 8px;
}
.citation-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.citation-item {
  background: #fafafa;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  padding: 8px 10px;
  margin-bottom: 8px;
}
.citation-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.citation-src {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}
.citation-score { margin-left: auto; }
.citation-excerpt {
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}
.input-area {
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}
.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}
.side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
}
.side-search { margin-bottom: 8px; }
.side-body {
  flex: 1;
  overflow-y: auto;
}
.hit-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 0;
}
.hit-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.hit-src {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}
.hit-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  max-height: 96px;
  overflow: hidden;
}
.hit-score {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}
</style>
