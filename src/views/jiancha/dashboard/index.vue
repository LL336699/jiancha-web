<template>
  <div class="dashboard-container">
    <!-- 核心指标卡 -->
    <el-row :gutter="12">
      <el-col :span="8" v-for="c in cards" :key="c.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.title }}</div>
          <div class="stat-value">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="sourceChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="violationChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="kbChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="clueTrendChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="reportTrendChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getDashboard } from '@/api/jiancha/dashboard'

export default {
  name: 'JianchaDashboard',
  data() {
    return {
      raw: null,
      charts: []
    }
  },
  computed: {
    cards() {
      if (!this.raw || !this.raw.cards) return []
      const c = this.raw.cards
      return [
        { key: 'clueTotal', title: '线索总量', value: c.clueTotal },
        { key: 'clueProcessing', title: '在办线索', value: c.clueProcessing },
        { key: 'clueDone', title: '已办结', value: c.clueDone },
        { key: 'clueOverdue', title: '超期线索', value: c.clueOverdue },
        { key: 'personTotal', title: '廉政档案人员', value: c.personTotal },
        { key: 'reportTotal', title: '文书生成', value: c.reportTotal },
        { key: 'kbDocTotal', title: '知识库文档', value: c.kbDocTotal },
        { key: 'kbChunkTotal', title: '知识库分块', value: c.kbChunkTotal },
        { key: 'conflictTotal', title: '利益冲突申报', value: c.conflictTotal }
      ]
    }
  },
  mounted() {
    this.load()
    window.addEventListener('resize', this.resizeAll)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeAll)
    this.charts.forEach(ch => ch && ch.dispose && ch.dispose())
  },
  methods: {
    resizeAll() {
      this.charts.forEach(ch => ch && ch.resize && ch.resize())
    },
    load() {
      getDashboard().then(res => {
        this.raw = res.data
        this.$nextTick(() => this.renderCharts())
      }).catch(() => {})
    },
    renderCharts() {
      this.charts = []
      this.pie(this.$refs.statusChart, '线索状态分布', this.raw.clueByStatus)
      this.pie(this.$refs.sourceChart, '线索来源分布', this.raw.clueBySource)
      this.bar(this.$refs.violationChart, '问题类型分布', this.raw.clueByViolation)
      this.pie(this.$refs.kbChart, '知识库分类分布', this.raw.kbByCategory)
      this.line(this.$refs.clueTrendChart, '线索月度趋势', this.raw.clueMonthly)
      this.line(this.$refs.reportTrendChart, '文书生成月度趋势', this.raw.reportMonthly)
    },
    pie(el, title, data) {
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
      this.charts.push(chart)
    },
    bar(el, title, data) {
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
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: data.map(d => d.value), itemStyle: { color: '#409EFF' } }]
      })
      this.charts.push(chart)
    },
    line(el, title, data) {
      if (!el || !data || !data.length) return
      const chart = echarts.init(el)
      chart.setOption({
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        grid: { top: 50, left: 50, right: 20, bottom: 40 },
        xAxis: { type: 'category', data: data.map(d => d.month) },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          smooth: true,
          data: data.map(d => d.value),
          itemStyle: { color: '#67C23A' },
          areaStyle: { opacity: 0.1 }
        }]
      })
      this.charts.push(chart)
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 8px;
}
.stat-card {
  margin-bottom: 4px;
}
.stat-title {
  color: #909399;
  font-size: 13px;
}
.stat-value {
  color: #303133;
  font-size: 28px;
  font-weight: 600;
  margin-top: 6px;
}
.chart {
  height: 320px;
}
</style>
