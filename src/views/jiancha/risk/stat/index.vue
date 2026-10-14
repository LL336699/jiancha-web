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

    <!-- ═══ 分布图表 ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="8">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="levelChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="ruleChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="24">
        <el-card shadow="never"><div ref="trendChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- ═══ 三级风险视图 ═══ -->
    <div class="section-title">三级风险视图（部门 → 岗位 → 个人）</div>
    <el-row :gutter="12">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>部门层（未闭环预警数）</span></template>
          <el-table :data="raw && raw.deptView" size="small" border max-height="320">
            <el-table-column label="部门" prop="name" />
            <el-table-column label="未闭环预警" prop="value" width="100" align="center" />
          </el-table>
          <el-empty v-if="!raw || !raw.deptView || !raw.deptView.length" description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>岗位层（模型权重分）</span></template>
          <el-table :data="raw && raw.positionView" size="small" border max-height="320">
            <el-table-column label="岗位" prop="name" />
            <el-table-column label="权重分" prop="value" width="90" align="center">
              <template #default="scope">
                <span :style="{ color: scope.row.value > 60 ? '#f56c6c' : '#303133', fontWeight: scope.row.value > 60 ? '600' : '400' }">
                  {{ scope.row.value }}
                </span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!raw || !raw.positionView || !raw.positionView.length" description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>个人层（未闭环预警数）</span></template>
          <el-table :data="raw && raw.personView" size="small" border max-height="320">
            <el-table-column label="人员" prop="name" />
            <el-table-column label="未闭环预警" prop="value" width="100" align="center" />
          </el-table>
          <el-empty v-if="!raw || !raw.personView || !raw.personView.length" description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="RiskStat">
import * as echarts from 'echarts'
import { riskStat } from '@/api/jiancha/risk'

const { proxy } = getCurrentInstance()
const raw = ref(null)
const charts = []

const cards = computed(() => {
  const c = raw.value || {}
  return [
    { key: 'total', title: '预警总量', value: c.total || 0, color: '#303133' },
    { key: 'pending', title: '待核实', value: c.pending || 0, color: '#e6a23c' },
    { key: 'verifying', title: '核实中', value: c.verifying || 0, color: '#409eff' },
    { key: 'confirmed', title: '已确认转整改', value: c.confirmed || 0, color: '#67c23a' },
    { key: 'excluded', title: '已排除误报', value: c.excluded || 0, color: '#909399' },
    { key: 'highOpen', title: '高级别未闭环', value: c.highOpen || 0, color: '#f56c6c' },
    { key: 'confirmRate', title: '转整改率(%)', value: c.confirmRate != null ? c.confirmRate : '—', color: '#303133' }
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
  riskStat().then(res => {
    raw.value = res.data
    nextTick(() => renderCharts())
  }).catch(() => {})
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.statusChart, '预警状态分布', raw.value.byStatus)
  pie(proxy.$refs.levelChart, '预警等级分布', raw.value.byLevel)
  bar(proxy.$refs.ruleChart, '规则命中分布', raw.value.byRule)
  line(proxy.$refs.trendChart, '近12个月预警趋势', raw.value.monthlyTrend)
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
      itemStyle: { color: '#f56c6c' },
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
.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin: 16px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
</style>
