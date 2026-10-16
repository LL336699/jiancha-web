<template>
  <div class="stat-container">
    <!-- ═══ 核心指标卡 ═══ -->
    <el-row :gutter="12">
      <el-col :span="3" v-for="c in cards" :key="c.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ c.title }}</div>
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ═══ 图表区 ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="6">
        <el-card shadow="never"><div ref="statusChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div ref="categoryChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div ref="channelChart" class="chart"></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div ref="satisfactionChart" class="chart"></div></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="24">
        <el-card shadow="never"><div ref="trendChart" class="chart"></div></el-card>
      </el-col>
    </el-row>

    <!-- ═══ 热点对象 + 低分复核（段16） ═══ -->
    <el-row :gutter="12" style="margin-top:12px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span>热点被举报对象 Top10</span></template>
          <el-table :data="raw && raw.topTargets ? raw.topTargets : []" size="small" border empty-text="暂无数据">
            <el-table-column label="排名" type="index" width="60" align="center" />
            <el-table-column label="被举报对象" prop="name" min-width="110">
              <template #default="scope">
                <el-tag v-if="scope.row.handling > 0" type="danger" size="small" style="margin-right: 4px">在办</el-tag>
                {{ scope.row.name }}
              </template>
            </el-table-column>
            <el-table-column label="举报次数" prop="total" width="90" align="center" sortable />
            <el-table-column label="未办结" prop="handling" width="80" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.handling > 0" type="danger" size="small">{{ scope.row.handling }}</el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column label="涉及金额合计" width="120" align="right">
              <template #default="scope">
                ¥ {{ Number(scope.row.amountSum || 0).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="最近举报" prop="lastTime" width="150" align="center" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span>低分满意度复核（1-2 星）</span>
            <el-tag v-if="raw && raw.dissatisfiedCount" type="danger" size="small" style="margin-left: 8px">{{ raw.dissatisfiedCount }} 件待复核</el-tag>
          </template>
          <el-table :data="dissatisfiedRows" v-loading="dissatisfiedLoading" size="small" border empty-text="暂无低分评价，服务质量良好">
            <el-table-column label="ID" prop="petitionId" width="70" align="center" />
            <el-table-column label="事由标题" prop="title" min-width="150" :show-overflow-tooltip="true" />
            <el-table-column label="评分" width="130" align="center">
              <template #default="scope">
                <el-rate :model-value="scope.row.satisfaction" disabled size="small" />
              </template>
            </el-table-column>
            <el-table-column label="评价时间" prop="satisfactionTime" width="150" align="center" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- ═══ 超期督办清单（段16） ═══ -->
    <el-card shadow="never" style="margin-top:12px">
      <template #header>
        <span>超期督办清单（未办结且超办理截止）</span>
        <span style="float: right">
          <el-button type="danger" plain size="small" icon="AlarmClock" @click="runAutoUrge" v-hasPermi="['jiancha:petition:urge']">执行超期自动催办</el-button>
          <el-button type="primary" link icon="Refresh" @click="loadOverdue">刷新</el-button>
        </span>
      </template>
      <el-table v-loading="overdueLoading" :data="overdueRows" size="small" border empty-text="暂无超期举报">
        <el-table-column label="举报ID" prop="petitionId" width="90" align="center" />
        <el-table-column label="事由标题" prop="title" min-width="200" :show-overflow-tooltip="true" />
        <el-table-column label="被举报对象" prop="targetName" width="110" align="center">
          <template #default="scope">
            <span>{{ scope.row.targetName || '未指明' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="办理截止" prop="handleDeadline" width="150" align="center" />
        <el-table-column label="超期(小时)" width="100" align="center">
          <template #default="scope">
            <el-tag type="danger" size="small">{{ overdueHours(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已催办" prop="urgeCount" width="80" align="center">
          <template #default="scope">
            <span>{{ scope.row.urgeCount || 0 }}次</span>
          </template>
        </el-table-column>
        <el-table-column label="最近催办" prop="lastUrgeTime" width="150" align="center">
          <template #default="scope">
            <span>{{ scope.row.lastUrgeTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button link type="warning" icon="Bell" @click="urgeRow(scope.row)" v-hasPermi="['jiancha:petition:urge']">催办</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="PetitionStat">
import * as echarts from 'echarts'
import { petitionStat, overduePetitions, dissatisfiedPetitions, triggerAutoUrge, urgePetition } from '@/api/jiancha/petition'

const { proxy } = getCurrentInstance()
const raw = ref(null)
const charts = []

// 段16：超期督办清单 + 低分复核清单
const overdueRows = ref([])
const overdueLoading = ref(false)
const dissatisfiedRows = ref([])
const dissatisfiedLoading = ref(false)

const cards = computed(() => {
  const c = raw.value || {}
  return [
    { key: 'total', title: '举报总量', value: c.total || 0, color: '#303133' },
    { key: 'pending', title: '待受理', value: c.pending || 0, color: '#e6a23c' },
    { key: 'handling', title: '办理中', value: c.handling || 0, color: '#409eff' },
    { key: 'finished', title: '已办结', value: c.finished || 0, color: '#67c23a' },
    { key: 'overdue', title: '超期(红灯)', value: c.overdue || 0, color: '#f56c6c' },
    { key: 'avgHours', title: '平均时长(小时)', value: c.avgHandleHours != null ? c.avgHandleHours : '—', color: '#303133' },
    { key: 'satisfaction', title: '满意度均分', value: c.satisfactionAvg ? (c.satisfactionAvg + '分/' + (c.satisfactionCount || 0) + '评') : '暂无', color: '#67c23a' },
    { key: 'urge', title: '累计催办', value: c.urgeTotal || 0, color: '#e6a23c' }
  ]
})

function overdueHours(row) {
  if (!row.handleDeadline) return 0
  const diff = Date.now() - new Date(row.handleDeadline.replace(/-/g, '/')).getTime()
  return diff > 0 ? Math.floor(diff / 3600000) : 0
}

onMounted(() => {
  load()
  loadOverdue()
  loadDissatisfied()
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

// 段16：加载超期督办清单
function loadOverdue() {
  overdueLoading.value = true
  overduePetitions().then(res => {
    overdueRows.value = res.data || []
    overdueLoading.value = false
  }).catch(() => { overdueLoading.value = false })
}

// 段16：加载低分满意度复核清单
function loadDissatisfied() {
  dissatisfiedLoading.value = true
  dissatisfiedPetitions().then(res => {
    dissatisfiedRows.value = res.data || []
    dissatisfiedLoading.value = false
  }).catch(() => { dissatisfiedLoading.value = false })
}

// 段16：手动触发超期自动催办（系统对超期未催办件各催办一次并写轨迹）
function runAutoUrge() {
  proxy.$modal.confirm('对全部超期且从未催办的举报执行一次系统催办（写轨迹留痕）？').then(() => {
    return triggerAutoUrge()
  }).then(res => {
    proxy.$modal.msgSuccess('本轮系统催办 ' + (res.data || 0) + ' 件')
    loadOverdue()
    load()
  }).catch(() => {})
}

// 段16：督办清单行内催办
function urgeRow(row) {
  proxy.$modal.prompt('填写催办意见（写入轨迹留痕）').then(({ value }) => {
    return urgePetition(row.petitionId, value || '')
  }).then(() => {
    proxy.$modal.msgSuccess('催办成功')
    loadOverdue()
    load()
  }).catch(() => {})
}

function renderCharts() {
  charts.length = 0
  pie(proxy.$refs.statusChart, '办理状态分布', raw.value.byStatus)
  pie(proxy.$refs.categoryChart, '舞弊类型分布', raw.value.byCategory)
  pie(proxy.$refs.channelChart, '提交渠道分布', raw.value.byChannel)
  pie(proxy.$refs.satisfactionChart, '举报人满意度分布', raw.value.satisfactionDist, '#67c23a')
  line(proxy.$refs.trendChart, '近12个月举报提交趋势', raw.value.monthlyTrend)
}

function pie(el, title, data, color) {
  if (!el || !data || !data.length) return
  const chart = echarts.init(el)
  chart.setOption({
    title: { text: title, left: 'center', textStyle: { fontSize: 13 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    color: color ? [color, '#409EFF', '#e6a23c', '#f56c6c', '#909399'] : undefined,
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
    title: { text: title, left: 'center', textStyle: { fontSize: 13 } },
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
</script>

<style scoped>
.stat-container { padding: 8px; }
.stat-card { margin-bottom: 4px; }
.stat-title { color: #909399; font-size: 13px; }
.stat-value { color: #303133; font-size: 24px; font-weight: 600; margin-top: 6px; }
.chart { height: 300px; }
</style>
