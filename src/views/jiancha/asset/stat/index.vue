<template>
  <div class="app-container">
    <!-- 指标卡 -->
    <el-row :gutter="12">
      <el-col :span="3" v-for="c in cards" :key="c.name">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.name }}</div>
          <div class="stat-value" :style="{ color: c.color || '#303133' }">{{ formatAmount(c.value) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 第一行 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="8">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="categoryChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div ref="sourceChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- 图表区 第二行 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="12">
        <el-card shadow="never"><div ref="keeperChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div ref="monthlyChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="AssetStat">
import * as echarts from "echarts"
import { statAsset } from "@/api/jiancha/asset"

const { proxy } = getCurrentInstance()

const raw = ref(null)
const charts = []

/** 指标卡：cards 为 List<{name,value}> */
const cards = computed(() => {
  if (!raw.value || !raw.value.cards) return []
  const colorMap = { "超期": "#F56C6C", "已处置": "#67C23A", "已退还": "#909399", "暂存": "#409EFF", "处置中": "#E6A23C", "估值": "#E6A23C" }
  return raw.value.cards.map(c => {
    let color = "#303133"
    for (const k of Object.keys(colorMap)) {
      if (c.name && c.name.indexOf(k) >= 0) { color = colorMap[k]; break }
    }
    return { name: c.name, value: c.value, color }
  })
})

/** 兼容 name/value 与其它键名的归一化 */
function normalize(list) {
  if (!list) return []
  return list.map(d => ({
    name: d.name || d.category || d.status || d.source || d.keeper || d.month || "未分类",
    value: num(d.value != null ? d.value : d.cnt)
  }))
}

function num(v) {
  return v == null ? 0 : v
}

function formatAmount(v) {
  if (v == null || v === "") return "0"
  if (typeof v === "number") {
    return v.toLocaleString("zh-CN", { maximumFractionDigits: 1 })
  }
  return String(v)
}

onMounted(() => {
  statAsset().then(res => {
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
  pie(proxy.$refs.statusChart, "财物状态分布", normalize(raw.value.byStatus))
  pie(proxy.$refs.categoryChart, "物品类别分布", normalize(raw.value.byCategory))
  pie(proxy.$refs.sourceChart, "财物来源分布", normalize(raw.value.bySource))
  bar(proxy.$refs.keeperChart, "保管人保管数量", normalize(raw.value.byKeeper))
  line(proxy.$refs.monthlyChart, "财物扣押月度趋势", normalize(raw.value.monthlySeize))
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
.stat-value { color: #303133; font-size: 22px; font-weight: 600; margin-top: 6px; }
.chart { height: 320px; }
</style>
