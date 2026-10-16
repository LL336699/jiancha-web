<template>
  <div class="app-container">
    <!-- 综合态势条 -->
    <el-row :gutter="12">
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="ov-title">全局在办事项</div>
          <div class="ov-value">{{ num(comprehensive.moduleCards && comprehensive.moduleCards.totalProcessing) }}</div>
          <div class="ov-sub">跨八大模块汇总</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="ov-title">超期事项</div>
          <div class="ov-value" :style="{ color: num(comprehensive.moduleCards && comprehensive.moduleCards.totalOverdue) > 0 ? '#F56C6C' : '#67C23A' }">
            {{ num(comprehensive.moduleCards && comprehensive.moduleCards.totalOverdue) }}
          </div>
          <div class="ov-sub">需优先督办</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="ov-title">整体灯色</div>
          <div class="ov-value">
            <el-tag :type="lightTagType[comprehensive.moduleCards && comprehensive.moduleCards.lightLevel] || 'success'" size="medium" effect="dark">
              {{ lightText[comprehensive.moduleCards && comprehensive.moduleCards.lightLevel] || "绿灯" }}
            </el-tag>
          </div>
          <div class="ov-sub">按超期规模综合判定</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="ov-title">快照环比</div>
          <div class="ov-value" :style="{ color: compareTrendColor }">{{ compareTrendText }}</div>
          <div class="ov-sub">{{ compare.subText }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 核心指标卡（基础看板 P6 M8） -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="8" v-for="c in cards" :key="c.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.title }}</div>
          <div class="stat-value">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-row :gutter="10" style="margin-top:12px">
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-download" @click="handleExport">导出看板</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-refresh" @click="handleRefreshSnapshot">刷新快照</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-view" @click="handleEvaluateAlerts">预警评估</el-button>
      </el-col>
    </el-row>

    <!-- 模块运行统计 + 红黄绿灯 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="16">
        <el-card shadow="never" header="模块运行统计">
          <el-table :data="moduleStats" border size="small" max-height="360">
            <el-table-column label="模块" prop="moduleName" width="110" />
            <el-table-column label="总量" prop="total" width="70" align="center" />
            <el-table-column label="在办" prop="processing" width="70" align="center" />
            <el-table-column label="办结" prop="done" width="70" align="center" />
            <el-table-column label="超期" prop="overdue" width="70" align="center">
              <template #default="scope">
                <span v-if="scope.row.overdue > 0" style="color:#F56C6C;font-weight:600">{{ scope.row.overdue }}</span>
                <span v-else>{{ scope.row.overdue }}</span>
              </template>
            </el-table-column>
            <el-table-column label="黑名单" prop="black" width="80" align="center">
              <template #default="scope">{{ scope.row.black > 0 ? scope.row.black : "—" }}</template>
            </el-table-column>
            <el-table-column label="灯色" width="80" align="center">
              <template #default="scope">
                <el-tag :type="lightTagType[scope.row.light] || 'success'" size="mini">{{ lightText[scope.row.light] || "绿灯" }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="说明" prop="note" min-width="120" :show-overflow-tooltip="true">
              <template #default="scope">{{ scope.row.note || "—" }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" header="模块健康评分">
          <div v-for="h in health" :key="h.moduleKey" class="health-row">
            <span class="health-name">{{ h.moduleName }}</span>
            <el-progress :percentage="healthScore(h)" :color="healthColor(h)" :stroke-width="12" style="flex:1;margin:0 10px" />
            <el-tag :type="healthTagType(h)" size="mini">{{ healthText(h) }}</el-tag>
          </div>
          <el-empty v-if="!health.length" description="暂无健康数据" :image-size="50" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 跨模块超期清单 -->
    <el-card shadow="never" header="跨模块超期事项" style="margin-top:12px">
      <div style="margin-bottom:10px">
        <el-radio-group v-model="overdueModule" size="small" @change="loadOverdue">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button v-for="m in overdueModules" :key="m.value" :label="m.value">{{ m.label }}</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="overdueItems" border size="small" max-height="320" empty-text="当前无超期事项">
        <el-table-column label="模块" prop="moduleName" width="100" />
        <el-table-column label="单号" prop="bizId" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="标题" prop="title" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column label="责任部门" prop="ownerDept" width="110" :show-overflow-tooltip="true" />
        <el-table-column label="责任人" prop="ownerName" width="90" :show-overflow-tooltip="true" />
        <el-table-column label="期限" prop="deadline" width="110">
          <template #default="scope">{{ parseTime(scope.row.deadline, "{y}-{m}-{d}") }}</template>
        </el-table-column>
        <el-table-column label="已超期(天)" prop="overdueDays" width="100" align="center">
          <template #default="scope">
            <span style="color:#F56C6C;font-weight:600">{{ scope.row.overdueDays }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 预警规则 + 评估结果 -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="14">
        <el-card shadow="never" header="预警规则">
          <template #extra>
            <el-button type="primary" size="mini" icon="el-icon-plus" @click="ruleFormOpen = true">新增规则</el-button>
          </template>
          <el-table :data="alertRules" border size="small" max-height="300" empty-text="暂无预警规则">
            <el-table-column label="规则名称" prop="ruleName" min-width="140" :show-overflow-tooltip="true" />
            <el-table-column label="模块" prop="moduleKey" width="90">
              <template #default="scope">{{ moduleNameOf(scope.row.moduleKey) }}</template>
            </el-table-column>
            <el-table-column label="指标" prop="metricType" width="110">
              <template #default="scope">{{ metricText[scope.row.metricType] || scope.row.metricType }}</template>
            </el-table-column>
            <el-table-column label="阈值" prop="threshold" width="60" align="center" />
            <el-table-column label="级别" prop="alertLevel" width="70" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.alertLevel === 'red' ? 'danger' : 'warning'" size="mini">
                  {{ scope.row.alertLevel === "red" ? "红色" : "黄色" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="启用" prop="enabled" width="60" align="center">
              <template #default="scope">
                <el-switch v-model="scope.row.enabled" active-value="1" inactive-value="0" disabled size="mini" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope">
                <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="handleDelRule(scope.row)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never" header="预警评估结果">
          <el-table :data="alertResults" border size="small" max-height="300" empty-text="点击「预警评估」生成对照结果">
            <el-table-column label="规则" prop="ruleName" min-width="130" :show-overflow-tooltip="true" />
            <el-table-column label="当前值" prop="currentValue" width="80" align="center" />
            <el-table-column label="阈值" prop="threshold" width="60" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.triggered" :type="scope.row.alertLevel === 'red' ? 'danger' : 'warning'" size="mini">
                  {{ scope.row.alertLevel === "red" ? "触发红警" : "触发黄警" }}
                </el-tag>
                <el-tag v-else type="success" size="mini">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门办理效能 -->
    <el-card shadow="never" header="部门办理效能" style="margin-top:12px">
      <el-table :data="deptWorkload" border size="small" max-height="300" empty-text="暂无部门办理数据">
        <el-table-column label="部门" prop="deptName" width="140" />
        <el-table-column label="模块" prop="moduleName" width="100" />
        <el-table-column label="承办总量" prop="total" width="90" align="center" />
        <el-table-column label="在办" prop="processing" width="80" align="center" />
        <el-table-column label="超期" prop="overdue" width="80" align="center">
          <template #default="scope">
            <span v-if="scope.row.overdue > 0" style="color:#F56C6C;font-weight:600">{{ scope.row.overdue }}</span>
            <span v-else>{{ scope.row.overdue }}</span>
          </template>
        </el-table-column>
        <el-table-column label="超期率" width="100" align="center">
          <template #default="scope">
            <span :style="{ color: overdueRate(scope.row) > 0 ? '#F56C6C' : '#67C23A' }">{{ overdueRateText(scope.row) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 原有基础看板图表（线索/知识库） -->
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

    <!-- 新增/编辑规则弹窗 -->
    <el-dialog title="新增预警规则" :visible.sync="ruleFormOpen" width="520px" append-to-body>
      <el-form ref="ruleRef" :model="ruleForm" :rules="ruleRules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="如：信访超期红色预警" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="监控模块" prop="moduleKey">
              <el-select v-model="ruleForm.moduleKey" placeholder="全部/指定模块" style="width:100%" clearable>
                <el-option v-for="m in overdueModules" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="监控指标" prop="metricType">
              <el-select v-model="ruleForm.metricType" placeholder="请选择" style="width:100%">
                <el-option v-for="(l, v) in metricText" :key="v" :label="l" :value="v" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="触发阈值" prop="threshold">
              <el-input-number v-model="ruleForm.threshold" :min="0" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警级别" prop="alertLevel">
              <el-select v-model="ruleForm.alertLevel" style="width:100%">
                <el-option label="红色预警" value="red" />
                <el-option label="黄色预警" value="yellow" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="ruleForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitRule">确 定</el-button>
        <el-button @click="ruleFormOpen = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="JianchaDashboard">
import * as echarts from "echarts"
import {
  getDashboard, getComprehensive, getModuleStats, getDashboardLights, getSnapshots,
  refreshSnapshot, compareSnapshot, getOverdueItems, getDeptWorkload, getModuleHealth,
  listAlertRules, addAlertRule, delAlertRule, evaluateAlerts, exportComprehensive
} from "@/api/jiancha/dashboard"

const { proxy } = getCurrentInstance()

const raw = ref(null)
const charts = []

const comprehensive = ref({})
const moduleStats = ref([])
const health = ref([])
const overdueItems = ref([])
const overdueModule = ref("")
const deptWorkload = ref([])
const alertRules = ref([])
const alertResults = ref([])
const compare = ref({})

const ruleFormOpen = ref(false)
const ruleForm = ref({})
const ruleRules = {
  ruleName: [{ required: true, message: "请填写规则名称", trigger: "blur" }],
  metricType: [{ required: true, message: "请选择监控指标", trigger: "change" }],
  threshold: [{ required: true, message: "请设置触发阈值", trigger: "blur" }],
  alertLevel: [{ required: true, message: "请选择预警级别", trigger: "change" }]
}

const lightTagType = { red: "danger", yellow: "warning", green: "success" }
const lightText = { red: "红灯", yellow: "黄灯", green: "绿灯" }
const metricText = {
  overdue: "超期事项数", processing: "在办事项数", black: "黑名单数量",
  total: "总量", done: "办结量", overdueRate: "超期率"
}
const overdueModules = [
  { value: "petition", label: "信访举报" },
  { value: "rectify", label: "整改台账" },
  { value: "reply", label: "意见回复" },
  { value: "conduct", label: "作风建设" },
  { value: "asset", label: "涉案财物" }
]
const moduleNameMap = {
  petition: "信访举报", rectify: "整改台账", risk: "风险防控", supplier: "供应商廉洁",
  edu: "廉政教育", reply: "意见回复", conduct: "作风建设", asset: "涉案财物"
}

/** 原有基础看板指标卡（保留 P6 M8 的 9 张卡） */
const cards = computed(() => {
  if (!raw.value || !raw.value.cards) return []
  const c = raw.value.cards
  return [
    { key: "clueTotal", title: "线索总量", value: c.clueTotal },
    { key: "clueProcessing", title: "在办线索", value: c.clueProcessing },
    { key: "clueDone", title: "已办结", value: c.clueDone },
    { key: "clueOverdue", title: "超期线索", value: c.clueOverdue },
    { key: "personTotal", title: "廉政档案人员", value: c.personTotal },
    { key: "reportTotal", title: "文书生成", value: c.reportTotal },
    { key: "kbDocTotal", title: "知识库文档", value: c.kbDocTotal },
    { key: "kbChunkTotal", title: "知识库分块", value: c.kbChunkTotal },
    { key: "conflictTotal", title: "利益冲突申报", value: c.conflictTotal }
  ]
})

const compareTrendText = computed(() => {
  const t = compare.value.trend
  if (t === "improved") return "改善 ↑"
  if (t === "worsened") return "恶化 ↓"
  if (t === "flat") return "持平 →"
  return "—"
})
const compareTrendColor = computed(() => {
  const t = compare.value.trend
  if (t === "improved") return "#67C23A"
  if (t === "worsened") return "#F56C6C"
  return "#909399"
})

function num(v) {
  return v == null ? 0 : v
}

function moduleNameOf(key) {
  return moduleNameMap[key] || key || "全部"
}

function healthScore(h) {
  return typeof h.score === "number" ? h.score : num(h.score)
}
function healthTagType(h) {
  const s = healthScore(h)
  if (s >= 90) return "success"
  if (s >= 75) return "primary"
  if (s >= 60) return "warning"
  return "danger"
}
function healthText(h) {
  return h.level || h.grade || "—"
}
function healthColor(h) {
  const s = healthScore(h)
  if (s >= 90) return "#67C23A"
  if (s >= 75) return "#409EFF"
  if (s >= 60) return "#E6A23C"
  return "#F56C6C"
}

function overdueRate(row) {
  const total = num(row.total)
  if (!total) return 0
  return num(row.overdue) / total
}
function overdueRateText(row) {
  return (overdueRate(row) * 100).toFixed(1) + "%"
}

function loadAll() {
  getDashboard().then(res => { raw.value = res.data || {}; nextTick(() => renderBaseCharts()) }).catch(() => {})
  getComprehensive().then(res => { comprehensive.value = res.data || {} }).catch(() => {})
  getModuleStats().then(res => { moduleStats.value = res.data || [] }).catch(() => {})
  getModuleHealth().then(res => { health.value = res.data || [] }).catch(() => {})
  getDeptWorkload().then(res => { deptWorkload.value = res.data || [] }).catch(() => {})
  listAlertRules().then(res => { alertRules.value = res.data || [] }).catch(() => {})
  compareSnapshot().then(res => { compare.value = res.data || {} }).catch(() => {})
  loadOverdue()
}

function loadOverdue() {
  getOverdueItems(overdueModule.value || undefined).then(res => {
    overdueItems.value = res.data || []
  }).catch(() => {})
}

function renderBaseCharts() {
  charts.length = 0
  if (!raw.value) return
  pie(proxy.$refs.statusChart, "线索状态分布", raw.value.clueByStatus)
  pie(proxy.$refs.sourceChart, "线索来源分布", raw.value.clueBySource)
  bar(proxy.$refs.violationChart, "问题类型分布", raw.value.clueByViolation)
  pie(proxy.$refs.kbChart, "知识库分类分布", raw.value.kbByCategory)
  line(proxy.$refs.clueTrendChart, "线索月度趋势", raw.value.clueMonthly)
  line(proxy.$refs.reportTrendChart, "文书生成月度趋势", raw.value.reportMonthly)
}

function pie(el, title, data) {
  if (!el || !data || !data.length) return
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
  if (!el || !data || !data.length) return
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
    series: [{ type: "bar", data: data.map(d => d.value), itemStyle: { color: "#409EFF" } }]
  })
  charts.push(chart)
}

function line(el, title, data) {
  if (!el || !data || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { top: 50, left: 50, right: 20, bottom: 40 },
    xAxis: { type: "category", data: data.map(d => d.month) },
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

function handleRefreshSnapshot() {
  refreshSnapshot().then(() => {
    proxy.$modal.msgSuccess("当日快照已生成/更新")
    loadAll()
  })
}

function handleEvaluateAlerts() {
  evaluateAlerts().then(res => {
    alertResults.value = res.data || []
    proxy.$modal.msgSuccess("预警评估完成")
  })
}

function handleDelRule(row) {
  proxy.$modal.confirm('确认删除预警规则「' + row.ruleName + '」？').then(function () {
    return delAlertRule(row.ruleId)
  }).then(() => {
    proxy.$modal.msgSuccess("已删除")
    listAlertRules().then(res => { alertRules.value = res.data || [] })
  }).catch(() => {})
}

function submitRule() {
  proxy.$refs["ruleRef"].validate(valid => {
    if (valid) {
      addAlertRule(ruleForm.value).then(() => {
        proxy.$modal.msgSuccess("规则已创建")
        ruleFormOpen.value = false
        listAlertRules().then(res => { alertRules.value = res.data || [] })
      })
    }
  })
}

function handleExport() {
  proxy.$modal.confirm("确认导出综合看板数据（XLSX）？").then(function () {
    return exportComprehensive()
  }).then(blob => {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement("a")
    link.href = url
    link.download = "纪检综合看板.xlsx"
    link.click()
    window.URL.revokeObjectURL(url)
  }).catch(() => {})
}

watch(ruleFormOpen, val => {
  if (val) {
    ruleForm.value = { alertLevel: "red", threshold: 1, moduleKey: undefined }
    nextTick(() => { if (proxy.$refs.ruleRef) proxy.$refs.ruleRef.clearValidate() })
  }
})

onMounted(() => {
  loadAll()
  window.addEventListener("resize", resizeAll)
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeAll)
  charts.forEach(ch => ch && ch.dispose && ch.dispose())
})

function resizeAll() {
  charts.forEach(ch => ch && ch.resize && ch.resize())
}
</script>

<style scoped>
.overview-card { text-align: center; }
.ov-title { color: #909399; font-size: 13px; }
.ov-value { font-size: 30px; font-weight: 600; margin-top: 8px; }
.ov-sub { color: #c0c4cc; font-size: 12px; margin-top: 4px; }
.stat-card { margin-bottom: 4px; }
.stat-title { color: #909399; font-size: 13px; }
.stat-value { color: #303133; font-size: 26px; font-weight: 600; margin-top: 6px; }
.chart { height: 320px; }
.health-row { display: flex; align-items: center; margin-bottom: 10px; }
.health-name { width: 80px; font-size: 13px; color: #606266; }
</style>
