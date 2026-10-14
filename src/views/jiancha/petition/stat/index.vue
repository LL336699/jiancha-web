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
        <el-card shadow="never"><div ref="categoryChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="channelChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="24">
        <el-card shadow="never"><div ref="trendChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="PetitionStat">
import * as echarts from 'echarts'
import { petitionStat } from '@/api/jiancha/petition'

const { proxy } = getCurrentInstance()
const raw = ref(null)
const charts = []

const cards = computed(() => {
  const c = raw.value || {}
  return [
    { key: 'total', title: '举报总量', value: c.total || 0, color: '#303133' },
    { key: 'pending', title: '待受理', value: c.pending || 0, color: '#e6a23c' },
    { key: 'handling', title: '办理中', value: c.handling || 0, color: '#409eff' },
    { key: 'finished', title: '已办结(归档/不予受理)', value: c.finished || 0, color: '#67c23a' },
    { key: 'overdue', title: '超期(红灯)', value: c.overdue || 0, color: '#f56c6c' },
    { key: 'avgHours', title: '平均办理时长(小时)', value: c.avgHandleHours != null ? c.avgHandleHours : '—', color: '#303133' }
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
  petitionStat().then(res => {
    raw.value = res.data
    nextTick(() => renderCharts())
  }).catch(() => {})
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.statusChart, '办理状态分布', raw.value.byStatus)
  pie(proxy.$refs.categoryChart, '舞弊类型分布', raw.value.byCategory)
  pie(proxy.$refs.channelChart, '提交渠道分布', raw.value.byChannel)
  line(proxy.$refs.trendChart, '近12个月举报提交趋势', raw.value.monthlyTrend)
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
    xAxis: { type: 'category', data: data.map(d => d.month) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map(d => d.value),
      itemStyle: { color: '#409EFF' },
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
