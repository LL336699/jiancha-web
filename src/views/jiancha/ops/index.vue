<template>
  <div class="app-container">
    <el-row :gutter="16" class="mb8">
      <el-col :span="18">
        <el-alert type="info" :closable="false" show-icon
          title="系统巡检为只读探测：数据层、缓存层、AI 能力、定时任务与业务待办，任何单项异常不影响其余检查。" />
      </el-col>
      <el-col :span="6" style="text-align: right">
        <el-button type="primary" icon="Refresh" :loading="loading" @click="runCheck">执行巡检</el-button>
      </el-col>
    </el-row>

    <el-row v-loading="loading" :gutter="16">
      <el-col v-for="group in groups" :key="group.name" :span="8" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <template #header>
            <div class="card-head">
              <span class="card-title">{{ group.name }} · {{ group.target }}</span>
              <el-tag :type="statusTag(group.status)" size="small">{{ group.status }}</el-tag>
            </div>
          </template>
          <div v-if="group.error" class="err-text">异常：{{ group.error }}</div>
          <el-descriptions v-else :column="1" size="small" border>
            <el-descriptions-item v-for="(v, k) in group.detail" :key="k" :label="String(k)">
              {{ formatValue(v) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row v-if="checkTime">
      <el-col :span="24">
        <el-text size="small" type="info">最近巡检时间：{{ checkTime }}</el-text>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Ops">
import { checkHealth } from '@/api/jiancha/ops'

const loading = ref(false)
const groups = ref([])
const checkTime = ref('')

function statusTag(status) {
  if (status === '正常') return 'success'
  if (status === '未配置') return 'warning'
  return 'danger'
}

function formatValue(v) {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function runCheck() {
  loading.value = true
  checkHealth().then(res => {
    groups.value = (res.data && res.data.groups) || []
    checkTime.value = res.data && res.data.checkTime
  }).finally(() => {
    loading.value = false
  })
}

runCheck()
</script>

<style lang="scss" scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
}
.err-text {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}
</style>
