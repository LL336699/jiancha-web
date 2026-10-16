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
        <el-card shadow="never"><div ref="gradeChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="qtypeChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="categoryChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- ═══ 图表区第二行 ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="monthlyChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="topWrongChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="EduStat">
import * as echarts from 'echarts'
import { eduStat } from '@/api/jiancha/edu'

const { proxy } = getCurrentInstance()
const raw = ref(null)
const charts = []

const cards = computed(() => {
  const c = raw.value || {}
  return [
    { key: 'questionTotal', title: '题目总量', value: c.questionTotal || 0, color: '#303133' },
    { key: 'questionEnabled', title: '启用题目', value: c.questionEnabled || 0, color: '#67c23a' },
    { key: 'paperTotal', title: '试卷总量', value: c.paperTotal || 0, color: '#409eff' },
    { key: 'examTotal', title: '考试人次', value: c.examTotal || 0, color: '#409eff' },
    { key: 'examPassed', title: '通过人次', value: c.examPassed || 0, color: '#67c23a' },
    { key: 'passRate', title: '通过率', value: c.passRate != null ? (Math.round(c.passRate * 1000) / 10) + '%' : '—', color: '#303133' },
    { key: 'commitExpected', title: '承诺书应签', value: c.commitExpected || 0, color: '#e6a23c' },
    { key: 'commitSigned', title: '承诺书已签', value: c.commitSigned || 0, color: '#67c23a' }
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
  eduStat().then(res => {
    raw.value = res.data || {}
    nextTick(() => renderCharts())
  }).catch(() => {})
}

/** 各聚合查询键名不统一（grade/qtype/category/month/title + cnt/wrongCnt），统一映射为 name/value */
function normalize(data, nameKeys, valueKeys) {
  if (!Array.isArray(data)) return []
  return data.map(d => {
    let name
    for (const k of nameKeys) {
      if (d[k] != null) { name = d[k]; break }
    }
    let value
    for (const k of valueKeys) {
      if (d[k] != null) { value = d[k]; break }
    }
    return { name: String(name ?? ''), value: Number(value ?? 0) }
  }).filter(d => d.name)
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.gradeChart, '成绩分布（优/良/中/差）', normalize(raw.value.scoreDistribution, ['grade', 'name'], ['cnt', 'value']))
  pie(proxy.$refs.qtypeChart, '题型引用分布', normalize(raw.value.byQtype, ['qtype', 'name'], ['cnt', 'value']))
  pie(proxy.$refs.categoryChart, '题目类别分布', normalize(raw.value.byCategory, ['category', 'name'], ['cnt', 'value']))
  line(proxy.$refs.monthlyChart, '近12个月交卷趋势', normalize(raw.value.monthlyExams, ['month', 'name'], ['cnt', 'value']))
  bar(proxy.$refs.topWrongChart, '错题 Top10（错误次数）', normalize(raw.value.topWrongQuestions, ['title', 'name'], ['wrongCnt', 'cnt', 'value']))
}

function pie(el, title, data) {
  if (!el || !data.length) return
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
  if (!el || !data.length) return
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
      itemStyle: { color: '#409EFF' },
      areaStyle: { opacity: 0.1 }
    }]
  })
  charts.push(chart)
}

function bar(el, title, data) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { top: 50, left: 60, right: 30, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => truncate(d.name, 12)), axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: { color: '#f56c6c' },
      barMaxWidth: 40
    }]
  })
  charts.push(chart)
}

/** 题干可能很长，坐标轴标签截断展示，完整内容在 tooltip 中查看 */
function truncate(text, max) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}
</script>

<style scoped>
.stat-container { padding: 8px; }
.stat-card { margin-bottom: 4px; }
.stat-title { color: #909399; font-size: 13px; }
.stat-value { color: #303133; font-size: 24px; font-weight: 600; margin-top: 6px; }
.chart { height: 300px; }
</style>
