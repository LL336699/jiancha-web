<template>
  <div class="app-container">
    <!-- 指标卡 -->
    <el-row :gutter="12">
      <el-col :span="4" v-for="c in cards" :key="c.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.title }}</div>
          <div class="stat-value" :style="{ color: c.color || '#303133' }">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 第一行 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="8">
        <el-card shadow="never"><div ref="matterChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="resultChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="deptChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- 图表区 第二行 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="monthlyChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="hitsChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="ReplyStat">
import * as echarts from "echarts"
import { statReply } from "@/api/jiancha/reply"

const { proxy } = getCurrentInstance()

const raw = ref(null)
const charts = []

/** 指标卡：cards 为 Map（total/pending/screened/replied/overdue/avgReplyDays） */
const cards = computed(() => {
  if (!raw.value || !raw.value.cards) return []
  const c = raw.value.cards
  return [
    { key: "total", title: "征求意见总量", value: num(c.total) },
    { key: "pending", title: "待筛查", value: num(c.pending), color: "#E6A23C" },
    { key: "screened", title: "已筛查待回复", value: num(c.screened), color: "#409EFF" },
    { key: "replied", title: "已回复", value: num(c.replied), color: "#67C23A" },
    { key: "overdue", title: "超期未回复", value: num(c.overdue), color: "#F56C6C" },
    { key: "avgReplyDays", title: "平均回复天数", value: num(c.avgReplyDays) + " 天", color: "#909399" }
  ]
})

function num(v) {
  return v == null ? 0 : v
}

/** 兼容 name/value 与其它键名的归一化 */
function normalize(list, nameKeys, valueKeys) {
  if (!list) return []
  return list.map(d => ({
    name: pick(d, nameKeys) || "未分类",
    value: num(pick(d, valueKeys))
  }))
}
function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null) return obj[k]
  }
  return undefined
}

onMounted(() => {
  statReply().then(res => {
    raw.value = res.data || {}
    nextTick(() => renderCharts())
  }).catch(() => {})
  window.addEventListener("resize", resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAll)
  charts.forEach(ch => ch && ch.dispose && ch.dispose())
})

function resizeAll() {
  charts.forEach(ch => ch && ch.resize && ch.resize())
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.matterChart, "事项类型分布", normalize(raw.value.byMatter, ["name", "matterType"], ["value", "cnt", "count"]))
  pie(proxy.$refs.resultChart, "回复结论分布", normalize(raw.value.byResult, ["name", "finalResult", "result"], ["value", "cnt", "count"]))
  bar(proxy.$refs.deptChart, "申请部门分布", normalize(raw.value.byDept, ["name", "dept"], ["value", "cnt", "count"]))
  line(proxy.$refs.monthlyChart, "征求意见月度趋势", normalize(raw.value.monthlyRequests, ["month"], ["value", "cnt", "count"]))
  bar(proxy.$refs.hitsChart, "系统筛查命中来源分布", normalize(raw.value.hitsByModule, ["name", "module"], ["value", "cnt", "count"]))
}

function pie(el, title, data) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0, type: "scroll" },
    series: [{
      type: "pie",
      radius: "55%",
      center: ["50%", "45%"],
      data: data.map(d => ({ name: d.name, value: d.value }))
    }]
  })
  charts.push(chart)
}

function bar(el, title, data) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { top: 50, left: 40, right: 20, bottom: 60 },
    xAxis: {
      type: "category",
      data: data.map(d => d.name),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: data.map(d => d.value), itemStyle: { color: "#409EFF" }, barMaxWidth: 36 }]
  })
  charts.push(chart)
}

function line(el, title, data) {
  if (!el || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { top: 50, left: 50, right: 20, bottom: 40 },
    xAxis: { type: "category", data: data.map(d => d.name) },
    yAxis: { type: "value" },
    series: [{
      type: "line",
      smooth: true,
      data: data.map(d => d.value),
      itemStyle: { color: "#67C23A" },
      areaStyle: { opacity: 0.1 }
    }]
  })
  charts.push(chart)
}
</script>

<style scoped>
.stat-card { margin-bottom: 4px; }
.stat-title { color: #909399; font-size: 13px; }
.stat-value { color: #303133; font-size: 24px; font-weight: 600; margin-top: 6px; }
.chart { height: 320px; }
</style>
