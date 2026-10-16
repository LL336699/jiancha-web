<template>
  <div class="app-container">
    <!-- 年度选择 + 导出 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="申报年度">
          <el-input-number v-model="year" :min="2020" :max="2100" controls-position="right" style="width: 130px" @change="loadAll" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadAll">查询</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="warning" plain icon="Download" @click="handleExport">导出年度清单</el-button>
          <el-button type="danger" plain icon="Bell" @click="handleExportUnDeclared">导出督办清单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 指标卡 -->
    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="4" v-for="c in cards" :key="c.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.title }}</div>
          <div class="stat-value" :style="{ color: c.color || '#303133' }">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 集中申报进度 -->
    <el-card shadow="never" style="margin-top: 12px">
      <template #header>
        <span>年度集中申报进度</span>
        <el-tag v-if="raw.expired" type="danger" size="small" style="margin-left: 8px">已超截止日</el-tag>
        <el-tag v-else-if="raw.deadline && daysLeft <= 30" type="warning" size="small" style="margin-left: 8px">临近截止</el-tag>
      </template>
      <el-alert v-if="raw.deadline" :type="raw.expired ? 'error' : (daysLeft <= 30 ? 'warning' : 'info')" :closable="false" style="margin-bottom: 12px">
        {{ raw.expired
          ? ('本年度集中申报已于 ' + deadlineText + ' 截止，超期 ' + Math.abs(daysLeft) + ' 天，未申报人员将纳入督办')
          : ('本年度集中申报截止日为 ' + deadlineText + '，还剩 ' + daysLeft + ' 天') }}
      </el-alert>
      <el-progress :percentage="progressPct" :color="progressColor" :stroke-width="18" text-inside />
      <div class="progress-note">
        已申报 {{ declaredCount }} 人 / 应在岗申报 {{ declaredCount + unDeclaredCount }} 人；
        尚有 <b style="color: #f56c6c">{{ unDeclaredCount }}</b> 名在岗人员未提交本年度申报
      </div>
    </el-card>

    <!-- 图表区 -->
    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="8">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="typeChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="monthlyChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- 重点关注人员 -->
    <el-card shadow="never" style="margin-top: 12px">
      <template #header>
        <span>重点关注人员（按利益冲突事项数排序，Top10）</span>
      </template>
      <el-table :data="personRows" size="small" border empty-text="本年度暂无申报数据">
        <el-table-column label="申报人" prop="personName" width="120" />
        <el-table-column label="所在部门" prop="personDept" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="申报单数" prop="declareCount" width="90" align="center" />
        <el-table-column label="事项数" prop="itemCount" width="90" align="center" />
        <el-table-column label="冲突事项数" prop="conflictItems" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.conflictItems > 0" type="danger" size="small">{{ scope.row.conflictItems }}</el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 未申报督办清单 -->
    <el-card shadow="never" style="margin-top: 12px">
      <template #header>
        <span>未申报人员督办清单（在岗且本年度无申报记录）</span>
      </template>
      <el-table v-loading="unDeclaredLoading" :data="unDeclaredRows" size="small" border empty-text="全员已完成申报">
        <el-table-column label="姓名" prop="name" width="100" />
        <el-table-column label="人员编号" prop="personCode" width="150" />
        <el-table-column label="部门" prop="deptPath" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="岗位" prop="position" width="130" :show-overflow-tooltip="true" />
        <el-table-column label="风险等级" prop="riskLevel" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.riskLevel === '正常' ? 'success' : 'warning'" size="small">{{ scope.row.riskLevel }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="DeclareStat">
import * as echarts from "echarts"
import { statDeclare, listUnDeclared, personStat, exportDeclare } from "@/api/jiancha/declare"

const { proxy } = getCurrentInstance()

const year = ref(new Date().getFullYear())
const raw = ref({})
const personRows = ref([])
const unDeclaredRows = ref([])
const unDeclaredLoading = ref(false)
const charts = []

const statusChart = ref(null)
const typeChart = ref(null)
const monthlyChart = ref(null)

function toMap(list) {
  const m = {}
  ;(list || []).forEach(it => { m[it.name] = Number(it.value || 0) })
  return m
}

const cards = computed(() => {
  const byStatus = toMap(raw.value.byStatus)
  return [
    { key: "total", title: "申报总量", value: raw.value.total || 0 },
    { key: "done", title: "已核实", value: byStatus["已核实"] || 0, color: "#67c23a" },
    { key: "pending", title: "待核实", value: byStatus["待核实"] || 0, color: "#e6a23c" },
    { key: "doubt", title: "存疑", value: byStatus["存疑"] || 0, color: "#f56c6c" },
    { key: "conflict", title: "含冲突事项申报单", value: raw.value.conflictDeclares || 0, color: "#f56c6c" },
    { key: "blacklist", title: "命中黑名单事项", value: raw.value.blacklistItems || 0, color: (raw.value.blacklistItems || 0) > 0 ? "#f56c6c" : "#67c23a" }
  ]
})

const declaredCount = computed(() => raw.value.total || 0)
const unDeclaredCount = computed(() => unDeclaredRows.value.length)

const daysLeft = computed(() => {
  return raw.value.daysLeft == null ? 9999 : Number(raw.value.daysLeft)
})

const deadlineText = computed(() => {
  if (!raw.value.deadline) return ''
  const d = new Date(raw.value.deadline)
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
})

const progressPct = computed(() => {
  const total = declaredCount.value + unDeclaredCount.value
  if (!total) return 100
  return Math.round((declaredCount.value / total) * 100)
})

const progressColor = computed(() => {
  const pct = progressPct.value
  if (pct >= 90) return "#67c23a"
  if (pct >= 60) return "#e6a23c"
  return "#f56c6c"
})

function normalize(list) {
  return (list || []).map(it => ({ name: it.name, value: Number(it.value || 0) }))
}

function loadAll() {
  statDeclare(year.value).then(res => {
    raw.value = res.data || {}
    nextTick(() => renderCharts())
  }).catch(() => {})
  personStat(year.value).then(res => {
    personRows.value = res.data || []
  }).catch(() => {})
  unDeclaredLoading.value = true
  listUnDeclared(year.value).then(res => {
    unDeclaredRows.value = res.data || []
    unDeclaredLoading.value = false
  }).catch(() => { unDeclaredLoading.value = false })
}

function renderCharts() {
  charts.length = 0
  pie(statusChart.value, "申报状态分布", normalize(raw.value.byStatus))
  pie(typeChart.value, "申报类型分布", normalize(raw.value.byType))
  line(monthlyChart.value, "月度申报趋势", normalize(raw.value.monthly))
}

function pie(el, title, data) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: "center", textStyle: { fontSize: 13 } },
    tooltip: { trigger: "item", formatter: "{b}: {c} 单 ({d}%)" },
    legend: { bottom: 0 },
    series: [{
      type: "pie", radius: ["40%", "65%"], center: ["50%", "48%"],
      label: { formatter: "{b}\n{c} 单" }, data
    }]
  })
  charts.push(chart)
}

function line(el, title, data) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: "center", textStyle: { fontSize: 13 } },
    tooltip: { trigger: "axis" },
    grid: { left: 44, right: 16, top: 40, bottom: 28 },
    xAxis: { type: "category", data: data.map(d => d.name) },
    yAxis: { type: "value", minInterval: 1 },
    series: [{ type: "line", smooth: true, areaStyle: { opacity: 0.15 }, data: data.map(d => d.value) }]
  })
  charts.push(chart)
}

function handleExport() {
  proxy.download("jiancha/archive/declare/export", { year: year.value }, "利益冲突申报清单_" + year.value + ".xlsx")
}

function handleExportUnDeclared() {
  proxy.download("jiancha/archive/declare/exportUnDeclared", { year: year.value }, "未申报人员督办清单_" + year.value + ".xlsx")
}

function resizeAll() {
  charts.forEach(ch => ch && ch.resize && ch.resize())
}

onMounted(() => {
  loadAll()
  window.addEventListener("resize", resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAll)
  charts.forEach(ch => ch && ch.dispose && ch.dispose())
})
</script>

<style scoped>
.filter-card { margin-bottom: 0; }
.stat-card { text-align: center; }
.stat-title { font-size: 13px; color: #909399; }
.stat-value { font-size: 26px; font-weight: 600; margin-top: 6px; }
.chart { height: 300px; }
.progress-note { margin-top: 8px; font-size: 13px; color: #606266; }
</style>
