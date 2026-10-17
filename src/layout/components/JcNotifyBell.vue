<template>
  <div>
    <el-popover ref="notifyPopover" placement="bottom-end" :width="340" trigger="manual" v-model:visible="notifyVisible" popper-class="jc-notify-popover">
      <!-- 弹出内容 -->
      <div class="jc-notify-header">
        <span class="jc-notify-title">业务提醒</span>
        <span class="jc-notify-goto" @click="gotoCenter">消息中心</span>
      </div>
      <div v-if="notifyLoading" class="jc-notify-loading">
        <el-icon class="is-loading"><Loading /></el-icon> 加载中...
      </div>
      <div v-else-if="notifyList.length === 0" class="jc-notify-empty">
        <el-icon style="font-size:24px;display:block;margin-bottom:6px;"><Bell /></el-icon>
        暂无未读消息
      </div>
      <div v-else>
        <div v-for="item in notifyList" :key="item.notifyId" class="jc-notify-item" @click="openItem(item)">
          <el-tag size="small" :type="tagType(item.notifyType)" class="jc-notify-tag">{{ item.notifyType }}</el-tag>
          <span class="jc-notify-item-title">{{ item.title }}</span>
          <span class="jc-notify-item-date">{{ shortTime(item.createTime) }}</span>
        </div>
        <div class="jc-notify-footer">
          <span class="jc-notify-markall" @click="markAll">全部已读</span>
        </div>
      </div>

      <!-- 触发器 -->
      <template #reference>
        <div class="right-menu-item hover-effect jc-notify-trigger" @mouseenter="onEnter" @mouseleave="onLeave">
          <svg-icon icon-class="message" />
          <span v-if="unreadCount > 0" class="jc-notify-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup>
import { listRecentNotify, getUnreadCount, markNotifyRead, markAllNotifyRead } from '@/api/jiancha/notify'

const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()

const notifyPopover = ref(null)
const notifyList = ref([])
const unreadCount = ref(0)
const notifyLoading = ref(false)
const notifyVisible = ref(false)
const leaveTimer = ref(null)
let pollTimer = null

// 消息类型 → 标签色
function tagType(type) {
  const map = { '举报': 'danger', '风控': 'danger', '整改': 'warning', '教育': 'primary', '申报': 'primary', '系统': 'info' }
  return map[type] || 'info'
}

function shortTime(t) {
  if (!t) return ''
  return String(t).slice(5, 16)
}

// 加载未读数 + 最近未读
function refresh() {
  getUnreadCount().then(res => {
    unreadCount.value = Number(res.data) || 0
  }).catch(() => {})
  notifyLoading.value = true
  listRecentNotify().then(res => {
    notifyList.value = res.data || []
  }).finally(() => {
    notifyLoading.value = false
  })
}

// 30s 轮询未读数（轻量接口）；下拉打开时同步刷新列表
onMounted(() => {
  refresh()
  pollTimer = setInterval(() => {
    if (!notifyVisible.value) {
      getUnreadCount().then(res => {
        unreadCount.value = Number(res.data) || 0
      }).catch(() => {})
    }
  }, 30000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// 鼠标移入铃铛区域
function onEnter() {
  clearTimeout(leaveTimer.value)
  refresh()
  notifyVisible.value = true
  nextTick(() => {
    const popper = notifyPopover.value?.popperRef?.contentRef
    if (popper && !popper._jcNotifyBound) {
      popper._jcNotifyBound = true
      popper.addEventListener('mouseenter', () => clearTimeout(leaveTimer.value))
      popper.addEventListener('mouseleave', () => {
        leaveTimer.value = setTimeout(() => { notifyVisible.value = false }, 150)
      })
    }
  })
}

// 鼠标离开铃铛区域
function onLeave() {
  leaveTimer.value = setTimeout(() => { notifyVisible.value = false }, 150)
}

// 点击单条：标记已读并跳转消息中心
function openItem(item) {
  if (item.notifyId) markNotifyRead(item.notifyId).catch(() => {})
  unreadCount.value = Math.max(0, unreadCount.value - 1)
  gotoCenter()
}

// 下拉内全部已读
function markAll() {
  markAllNotifyRead().then(() => {
    unreadCount.value = 0
    notifyList.value = []
  }).catch(() => {})
}

// 跳转消息中心页（若已在消息中心则广播刷新事件）
function gotoCenter() {
  notifyVisible.value = false
  if (route.path === '/jiancha/notify') {
    window.dispatchEvent(new Event('jc-notify-refresh'))
    return
  }
  router.push('/jiancha/notify')
}
</script>

<style lang="scss" scoped>
.jc-notify-trigger {
  position: relative;
  .svg-icon { width: 1.2em; height: 1.2em; vertical-align: -0.2em; }
  .jc-notify-badge {
    position: absolute;
    top: 7px;
    right: -3px;
    background: #f56c6c;
    color: #fff;
    border-radius: 10px;
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    padding: 0 4px;
    min-width: 16px;
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
}
.jc-notify-popover { padding: 0 !important; }
.jc-notify-popover .jc-notify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f7f9fb;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.jc-notify-popover .jc-notify-goto {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: normal;
  cursor: pointer;
}
.jc-notify-popover .jc-notify-goto:hover { color: #2b7cc1; }
.jc-notify-popover .jc-notify-loading,
.jc-notify-popover .jc-notify-empty {
  padding: 24px;
  text-align: center;
  color: #bbb;
  font-size: 12px;
  line-height: 1.8;
}
.jc-notify-popover .jc-notify-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}
.jc-notify-popover .jc-notify-item:last-child { border-bottom: none; }
.jc-notify-popover .jc-notify-item:hover { background: #f7f9fb; }
.jc-notify-popover .jc-notify-tag { flex-shrink: 0; }
.jc-notify-popover .jc-notify-item-title {
  flex: 1;
  font-size: 12px;
  color: #333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.jc-notify-popover .jc-notify-item-date {
  flex-shrink: 0;
  font-size: 11px;
  color: #bbb;
}
.jc-notify-popover .jc-notify-footer {
  text-align: center;
  padding: 8px 0;
  border-top: 1px solid #f5f5f5;
}
.jc-notify-popover .jc-notify-markall {
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
}
.jc-notify-popover .jc-notify-markall:hover { color: #2b7cc1; }
</style>
