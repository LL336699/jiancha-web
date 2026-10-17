<template>
  <div class="app-container">
    <!-- 未读类型统计条 -->
    <div v-if="unreadStat.length" class="mb8 stat-bar">
      <el-tag v-for="s in unreadStat" :key="s.notifyType" class="stat-item" effect="dark"
        :type="tagType(s.notifyType)" style="cursor: pointer" @click="filterByStat(s.notifyType)">
        {{ s.notifyType }} <b>{{ s.unread }}</b>
      </el-tag>
      <el-link type="info" :underline="false" style="margin-left: 12px" @click="resetQuery">清除筛选</el-link>
    </div>

    <!-- 筛选栏 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="消息类型" prop="notifyType">
        <el-select v-model="queryParams.notifyType" placeholder="全部类型" clearable style="width: 140px">
          <el-option v-for="dict in jc_notify_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="阅读状态" prop="readFlagQuery">
        <el-select v-model="queryParams.readFlagQuery" placeholder="全部状态" clearable style="width: 140px">
          <el-option label="未读" value="0" />
          <el-option label="已读" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="按标题模糊搜索" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Check" :disabled="!selectedUnread" @click="handleMarkSelectedRead" v-hasPermi="['jiancha:notify:read']">标记已读</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Finished" @click="handleMarkAllRead" v-hasPermi="['jiancha:notify:read']">全部已读</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['jiancha:notify:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DeleteFilled" @click="handleCleanRead" v-hasPermi="['jiancha:notify:remove']">清空已读</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Download" @click="handleExport" v-hasPermi="['jiancha:notify:list']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="notifyList" @selection-change="handleSelectionChange" row-key="notifyId">
      <el-table-column type="selection" width="46" align="center" :selectable="row => !row.isRead || true" />
      <el-table-column label="状态" width="76" align="center">
        <template #default="scope">
          <el-badge is-dot :hidden="scope.row.isRead === '1'" class="unread-dot">
            <el-tag size="small" :type="tagType(scope.row.notifyType)" disable-transitions>{{ scope.row.notifyType }}</el-tag>
          </el-badge>
        </template>
      </el-table-column>
      <el-table-column label="标题" min-width="260" show-overflow-tooltip>
        <template #default="scope">
          <span :class="{ 'unread-title': scope.row.isRead === '0' }" style="cursor: pointer" @click="openDetail(scope.row)">{{ scope.row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内容" min-width="300" show-overflow-tooltip prop="content" />
      <el-table-column label="时间" align="center" width="160" prop="createTime" />
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="openDetail(scope.row)">查看</el-button>
          <el-button v-if="scope.row.isRead === '0'" link type="warning" icon="Check" @click="handleRead(scope.row)" v-hasPermi="['jiancha:notify:read']">已读</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:notify:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" size="420px" :title="detailItem.title">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="类型">{{ detailItem.notifyType }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ detailItem.createTime }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ detailItem.content || '（无补充内容）' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="detailItem.isRead === '1' ? 'info' : 'danger'">{{ detailItem.isRead === '1' ? '已读' : '未读' }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px; text-align: right">
        <el-button type="primary" @click="goBizModule(detailItem)">前往业务模块</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="Notify">
import { listNotify, getUnreadCount, getUnreadStat, markNotifyRead, markAllNotifyRead, delNotify, cleanReadNotify, exportNotify } from '@/api/jiancha/notify'

const { proxy } = getCurrentInstance()
const { jc_notify_type } = proxy.useDict("jc_notify_type")

const notifyList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const multiple = ref(true)
const detailVisible = ref(false)
const detailItem = ref({})
const ids = ref([])
const unreadIds = ref([])
const unreadStat = ref([])

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    notifyType: undefined,
    readFlagQuery: undefined,
    title: undefined
  }
})
const { queryParams } = toRefs(data)

function tagType(type) {
  const map = { '举报': 'danger', '风控': 'danger', '整改': 'warning', '教育': 'primary', '申报': 'primary', '系统': 'info' }
  return map[type] || 'info'
}

function getList() {
  loading.value = true
  listNotify(queryParams.value).then(res => {
    notifyList.value = res.rows || []
    total.value = Number(res.total || 0)
  }).finally(() => {
    loading.value = false
  })
  getUnreadStat().then(res => {
    unreadStat.value = res.data || []
  }).catch(() => {})
}

// 点击统计徽标：按类型筛选未读
function filterByStat(type) {
  queryParams.value.notifyType = type
  queryParams.value.readFlagQuery = '0'
  queryParams.value.pageNum = 1
  getList()
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.notifyId)
  unreadIds.value = selection.filter(item => item.isRead === '0').map(item => item.notifyId)
  multiple.value = !selection.length
}

const selectedUnread = computed(() => unreadIds.value.length === 0)

// 标记勾选的未读消息已读
function handleMarkSelectedRead() {
  if (unreadIds.value.length === 0) {
    proxy.$modal.msgWarning("勾选项中没有未读消息")
    return
  }
  Promise.all(unreadIds.value.map(id => markNotifyRead(id))).then(() => {
    proxy.$modal.msgSuccess("已标记 " + unreadIds.value.length + " 条已读")
    getList()
  })
}

function handleMarkAllRead() {
  proxy.$modal.confirm("确认将全部未读消息标记为已读？").then(() => {
    return markAllNotifyRead()
  }).then(() => {
    proxy.$modal.msgSuccess("全部已读")
    getList()
  }).catch(() => {})
}

function handleRead(row) {
  markNotifyRead(row.notifyId).then(() => {
    getList()
  })
}

function handleDelete(row) {
  const delIds = row.notifyId ? [row.notifyId] : ids.value
  proxy.$modal.confirm("确认删除选中的 " + delIds.length + " 条消息？").then(() => {
    return Promise.all(delIds.map(id => delNotify(id)))
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleCleanRead() {
  proxy.$modal.confirm("确认清空全部已读消息？该操作不可恢复。").then(() => {
    return cleanReadNotify()
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已清空")
  }).catch(() => {})
}

// 导出消息清单（当前筛选条件）
function handleExport() {
  exportNotify(queryParams.value).then(res => {
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '消息通知_' + new Date().toISOString().slice(0, 10) + '.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  })
}

// 打开详情抽屉：未读消息自动标记已读
function openDetail(row) {
  detailItem.value = row
  detailVisible.value = true
  if (row.isRead === '0') {
    markNotifyRead(row.notifyId).then(() => {
      row.isRead = '1'
      getList()
    }).catch(() => {})
  }
}

// 前往对应业务模块页面（路由与菜单实际 path 对齐）
function goBizModule(item) {
  detailVisible.value = false
  const routeMap = {
    petition: '/jiancha/petition/petitionmanage',
    rectify: '/jiancha/rectify/rectifyissue',
    risk: '/jiancha/risk/riskalert',
    kb: '/jiancha/kb/kbdoc',
    clue: '/jiancha/clue',
    conflict: '/jiancha/declare',
    supplier: '/jiancha/supplier'
  }
  const path = routeMap[item.bizModule]
  if (path) {
    proxy.$router.push(path)
  } else {
    proxy.$modal.msg("该消息未关联可跳转页面")
  }
}

// 顶栏铃铛跳转/单条点击时广播的刷新事件
window.addEventListener('jc-notify-refresh', getList)
onBeforeUnmount(() => {
  window.removeEventListener('jc-notify-refresh', getList)
})

getList()
</script>

<style lang="scss" scoped>
.stat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.stat-item .b {
  font-weight: 700;
  margin-left: 4px;
}
.unread-dot :deep(.el-badge__content) {
  top: 8px;
  right: 14px;
}
.unread-title {
  font-weight: 600;
  color: #303133;
}
</style>
