<template>
  <div class="stat-container">
    <!-- ═══ 核心指标卡 ═══ -->
    <el-row :gutter="12">
      <el-col :span="4" v-for="c in cards" :key="c.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.title }}</div>
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ═══ 图表区第一行 ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="8">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="categoryChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="linkTypeChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- ═══ 图表区第二行 ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="blackTrendChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="topHitChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="SupplierStat">
import * as echarts from 'echarts'
import { supplierStat } from '@/api/jiancha/supplier'

const { proxy } = getCurrentInstance()
const raw = ref(null)
const charts = []

const cards = computed(() => {
  const c = raw.value || {}
  return [
    { key: 'total', title: '供应商总量', value: c.totalSuppliers || 0, color: '#303133' },
    { key: 'pending', title: '待审查', value: c.pendingCount || 0, color: '#e6a23c' },
    { key: 'normal', title: '正常', value: c.normalCount || 0, color: '#67c23a' },
    { key: 'observe', title: '观察期', value: c.observeCount || 0, color: '#e6a23c' },
    { key: 'black', title: '黑名单/禁入', value: c.blackCount || 0, color: '#f56c6c' },
    { key: 'activeAgreements', title: '有效协议', value: c.activeAgreements || 0, color: '#409eff' },
    { key: 'expiringAgreements', title: '协议临期', value: c.expiringAgreements || 0, color: '#e6a23c' },
    { key: 'linkPending', title: '关联待处置', value: c.linkPendingCount || 0, color: '#f56c6c' }
  ]
})

onMounted(() => {
  load()
  window.addEventListener('resize', resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  charts.forEach(ch => ch && ch.dispose && ch.dispose())
})

function resizeAll() {
  charts.forEach(ch => ch && ch.resize && ch.resize())
}

function load() {
  supplierStat().then(res => {
    raw.value = res.data || {}
    nextTick(() => renderCharts())
  }).catch(() => {})
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.statusChart, '档案状态分布', raw.value.byStatus)
  pie(proxy.$refs.categoryChart, '供应类别分布', raw.value.byCategory)
  pie(proxy.$refs.linkTypeChart, '关联类型分布', raw.value.byLinkType)
  line(proxy.$refs.blackTrendChart, '近12个月拉黑趋势', raw.value.blackTrend)
  bar(proxy.$refs.topHitChart, '关联命中 Top10 供应商', raw.value.topHitSuppliers)
}

function pie(el, title, data) {
  if (!el || !data || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: '55%',
      center: ['50%', '45%'],
      data: data.map(d => ({ name: d.name, value: d.value }))
    }]
  })
  charts.push(chart)
}

function line(el, title, data) {
  if (!el || !data || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { top: 50, left: 50, right: 20, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => d.name) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map(d => d.value),
      itemStyle: { color: '#f56c6c' },
      areaStyle: { opacity: 0.1 }
    }]
  })
  charts.push(chart)
}

function bar(el, title, data) {
  if (!el || !data || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { top: 50, left: 60, right: 30, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: { color: '#e6a23c' },
      barMaxWidth: 40
    }]
  })
  charts.push(chart)
}
</script>

<style scoped>
.stat-container { padding: 8px; }
.stat-card { margin-bottom: 4px; }
.stat-title { color: #909399; font-size: 13px; }
.stat-value { color: #303133; font-size: 24px; font-weight: 600; margin-top: 6px; }
.chart { height: 300px; }
</style>
