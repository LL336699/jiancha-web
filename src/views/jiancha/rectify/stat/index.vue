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

    <!-- ═══ 图表区 ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="8">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="sourceChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="severityChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="trendChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="deptChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="RectifyStat">
import * as echarts from 'echarts'
import { rectifyStat } from '@/api/jiancha/rectify'

const { proxy } = getCurrentInstance()
const raw = ref(null)
const charts = []

const cards = computed(() => {
  const c = raw.value || {}
  return [
    { key: 'total', title: '问题总量', value: c.total || 0, color: '#303133' },
    { key: 'pending', title: '待整改', value: c.pending || 0, color: '#e6a23c' },
    { key: 'rectifying', title: '整改中(含待复核)', value: c.rectifying || 0, color: '#409eff' },
    { key: 'closed', title: '已销号', value: c.closed || 0, color: '#67c23a' },
    { key: 'overdue', title: '超期(红灯)', value: c.overdue || 0, color: '#f56c6c' },
    { key: 'avgCloseDays', title: '平均销号天数', value: c.avgCloseDays != null ? c.avgCloseDays : '—', color: '#303133' },
    { key: 'revisitCount', title: '回头看重开次数', value: c.revisitCount || 0, color: '#e6a23c' }
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
  rectifyStat().then(res => {
    raw.value = res.data
    nextTick(() => renderCharts())
  }).catch(() => {})
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.statusChart, '整改状态分布', raw.value.byStatus)
  pie(proxy.$refs.sourceChart, '问题来源分布', raw.value.bySource)
  pie(proxy.$refs.severityChart, '严重程度分布', raw.value.bySeverity)
  line(proxy.$refs.trendChart, '近12个月问题登记趋势', raw.value.monthlyTrend)
  bar(proxy.$refs.deptChart, '责任部门未销号问题数', raw.value.byTargetDept)
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

function bar(el, title, data) {
  if (!el || !data || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { top: 50, left: 40, right: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', data: data.map(d => d.value), itemStyle: { color: '#e6a23c' } }]
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
    xAxis: { type: 'category', data: data.map(d => d.month) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map(d => d.value),
      itemStyle: { color: '#67C23A' },
      areaStyle: { opacity: 0.1 }
    }]
  })
  charts.push(chart)
}
</script>

<style scoped>
.stat-container { padding: 8px; }
.stat-card { margin-bottom: 4px; }
.stat-title { color: #909399; font-size: 13px; }
.stat-value { color: #303133; font-size: 26px; font-weight: 600; margin-top: 6px; }
.chart { height: 300px; }
</style>
