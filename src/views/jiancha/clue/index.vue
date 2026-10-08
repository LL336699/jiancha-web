<template>
  <div class="app-container">
    <!-- ═══ 统计概览 ═══ -->
    <el-row :gutter="12" class="mb8">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-num">{{ stat.total || 0 }}</div>
          <div class="stat-label">线索总量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ stat.active || 0 }}</div>
          <div class="stat-label">在办线索</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ stat.overdue || 0 }}</div>
          <div class="stat-label">已超期</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ stat.month || 0 }}</div>
          <div class="stat-label">本月新增</div>
        </div>
      </el-col>
    </el-row>

    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="线索编号" prop="clueNo">
        <el-input v-model="queryParams.clueNo" placeholder="请输入线索编号" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="来源" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="来源类型" clearable style="width: 150px">
          <el-option v-for="d in jc_clue_source" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="办理状态" clearable style="width: 140px">
          <el-option v-for="d in jc_clue_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="预警" prop="warnLevel">
        <el-select v-model="queryParams.warnLevel" placeholder="预警级别" clearable style="width: 120px">
          <el-option v-for="d in jc_warn_level" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="摘要" prop="summary">
        <el-input v-model="queryParams.summary" placeholder="线索摘要关键字" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- ═══ 工具栏 ═══ -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:clue:add']">登记线索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Bell" :loading="warnLoading" @click="handleRefreshWarn" v-hasPermi="['jiancha:clue:edit']">刷新预警</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Download" @click="handleExport" v-hasPermi="['jiancha:clue:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- ═══ 线索列表 ═══ -->
    <el-table v-loading="loading" :data="clueList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="线索编号" align="center" prop="clueNo" width="140" />
      <el-table-column label="来源" align="center" prop="sourceType" width="110">
        <template #default="scope">
          <dict-tag :options="jc_clue_source" :value="scope.row.sourceType" />
        </template>
      </el-table-column>
      <el-table-column label="问题类型" align="center" prop="violationType" width="110">
        <template #default="scope">
          <dict-tag :options="jc_violation_type" :value="scope.row.violationType" />
        </template>
      </el-table-column>
      <el-table-column label="线索摘要" align="left" prop="summary" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="涉及人员" align="center" prop="personName" width="100" />
      <el-table-column label="承办部门" align="center" prop="deptName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_clue_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="截止日期" align="center" prop="deadline" width="110" />
      <el-table-column label="时限" align="center" prop="remainDays" width="110">
        <template #default="scope">
          <span v-if="scope.row.status === '4' || scope.row.status === '5'" style="color:#909399">—</span>
          <span v-else-if="scope.row.remainDays === null || scope.row.remainDays === undefined">未设</span>
          <span v-else-if="scope.row.remainDays < 0" style="color:#f56c6c">超期 {{ -scope.row.remainDays }} 天</span>
          <span v-else style="color:#67c23a">剩余 {{ scope.row.remainDays }} 天</span>
        </template>
      </el-table-column>
      <el-table-column label="预警" align="center" prop="warnLevel" width="90">
        <template #default="scope">
          <dict-tag v-if="scope.row.warnLevel" :options="jc_warn_level" :value="scope.row.warnLevel" />
          <span v-else style="color:#c0c4cc">正常</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          <el-button link type="primary" icon="Promotion" @click="openHandle(scope.row)" v-hasPermi="['jiancha:clue:handle']">流转</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:clue:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:clue:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 登记 / 修改线索 ═══ -->
    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="clueRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="线索编号" prop="clueNo">
              <el-input v-model="form.clueNo" placeholder="留空自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源类型" prop="sourceType">
              <el-select v-model="form.sourceType" placeholder="请选择来源" style="width: 100%">
                <el-option v-for="d in jc_clue_source" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="问题类型" prop="violationType">
              <el-select v-model="form.violationType" placeholder="请选择问题类型" style="width: 100%">
                <el-option v-for="d in jc_violation_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="涉及人员" prop="personId">
              <el-select v-model="form.personId" placeholder="从廉洁档案选择" clearable filterable style="width: 100%">
                <el-option v-for="p in personOptions" :key="p.personId" :label="p.name + (p.position ? '（' + p.position + '）' : '')" :value="p.personId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="承办部门" prop="deptId">
              <el-tree-select v-model="form.deptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择承办部门" clearable check-strictly style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联人员" prop="relatedPersons">
              <el-input v-model="form.relatedPersons" placeholder="多人以逗号分隔" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="线索摘要" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="一句话概括线索" />
        </el-form-item>
        <el-form-item label="详细情况" prop="detail">
          <el-input v-model="form.detail" type="textarea" :rows="4" placeholder="线索详细情况" />
        </el-form-item>
        <el-form-item label="来源文号" prop="sourceRef">
          <el-input v-model="form.sourceRef" placeholder="如举报编号、审计报告号等" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 线索详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'线索详情 - ' + (detailClue.clueNo || '')" size="60%">
      <el-descriptions :column="3" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="来源"><dict-tag :options="jc_clue_source" :value="detailClue.sourceType" /></el-descriptions-item>
        <el-descriptions-item label="问题类型"><dict-tag :options="jc_violation_type" :value="detailClue.violationType" /></el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="jc_clue_status" :value="detailClue.status" /></el-descriptions-item>
        <el-descriptions-item label="涉及人员">{{ detailClue.personName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="承办部门">{{ detailClue.deptName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="当前处理人">{{ detailClue.handlerName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="登记时间">{{ detailClue.createTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ detailClue.deadline || '—' }}</el-descriptions-item>
        <el-descriptions-item label="预警">{{ detailClue.warnLevel || '正常' }}</el-descriptions-item>
        <el-descriptions-item label="处置方式" :span="3">
          <dict-tag v-if="detailClue.disposition" :options="jc_clue_disposition" :value="detailClue.disposition" />
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="线索摘要" :span="3">{{ detailClue.summary }}</el-descriptions-item>
        <el-descriptions-item label="详细情况" :span="3">{{ detailClue.detail || '—' }}</el-descriptions-item>
      </el-descriptions>

      <el-alert v-if="duplicates.length" type="warning" :closable="false" style="margin-bottom: 12px">
        <div><b>疑似重复线索（同一被反映人 {{ dupWindow }} 天内共 {{ duplicates.length }} 条）：</b></div>
        <div v-for="d in duplicates" :key="d.clueId">
          · {{ d.clueNo }}｜{{ d.summary }}（{{ d.createTime }}）
        </div>
        <div style="margin-top:4px;color:#909399">仅作提示，是否合并须人工确认。</div>
      </el-alert>

      <div class="section-title">办理轨迹（全程留痕）</div>
      <el-timeline v-if="traces.length" style="padding-left: 4px">
        <el-timeline-item v-for="t in traces" :key="t.traceId" :timestamp="t.operateTime" placement="top" type="primary">
          <div class="trace-title">{{ t.actionDesc }}</div>
          <div class="trace-sub">
            {{ t.operatorName || 'system' }}
            <span v-if="t.beforeStatus || t.afterStatus">
              · {{ statusLabel(t.beforeStatus) }} → {{ statusLabel(t.afterStatus) }}
            </span>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无办理轨迹" :image-size="80" />

      <div style="margin-top: 16px">
        <el-button type="primary" icon="Promotion" @click="openHandle(detailClue)" v-hasPermi="['jiancha:clue:handle']">流转办理</el-button>
      </div>
    </el-drawer>

    <!-- ═══ 流转对话框 ═══ -->
    <el-dialog title="线索流转" v-model="handleOpen" width="600px" append-to-body>
      <el-form ref="handleRef" :model="handleForm" :rules="handleRules" label-width="100px">
        <el-form-item label="当前状态">
          <dict-tag :options="jc_clue_status" :value="currentClue.status" />
        </el-form-item>
        <el-form-item label="流转动作" prop="action">
          <el-select v-model="handleForm.action" placeholder="请选择动作" style="width: 100%">
            <el-option v-for="a in availableActions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'assign'" label="承办部门">
          <el-tree-select v-model="handleForm.deptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择承办部门" clearable check-strictly style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'review'" label="修正问题类型">
          <el-select v-model="handleForm.violationType" placeholder="研判后可选修正" clearable style="width: 100%">
            <el-option v-for="d in jc_violation_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'dispose' || handleForm.action === 'close'" label="处置方式">
          <el-select v-model="handleForm.disposition" placeholder="请选择处置方式" clearable style="width: 100%">
            <el-option v-for="d in jc_clue_disposition" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="办理意见" prop="opinion">
          <el-input v-model="handleForm.opinion" type="textarea" :rows="3" placeholder="填写办理意见、处置说明（将写入轨迹留痕）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitHandle">确认流转</el-button>
          <el-button @click="handleOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Clue">
import { listClue, getClue, addClue, updateClue, delClue, handleClue, getClueTrace, detectDuplicate, clueStatOverview, refreshClueWarn } from "@/api/jiancha/clue"
import { listPerson } from "@/api/jiancha/person"
import { deptTreeSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { jc_clue_source, jc_violation_type, jc_clue_status, jc_clue_disposition, jc_warn_level } =
  useDict("jc_clue_source", "jc_violation_type", "jc_clue_status", "jc_clue_disposition", "jc_warn_level")

const clueList = ref([])
const personOptions = ref([])
const deptOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const total = ref(0)
const title = ref("")
const warnLoading = ref(false)
const stat = ref({})
const dupWindow = ref(90)

const detailOpen = ref(false)
const detailClue = ref({})
const traces = ref([])
const duplicates = ref([])

const handleOpen = ref(false)
const currentClue = ref({})

const data = reactive({
  form: {},
  handleForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    clueNo: undefined,
    sourceType: undefined,
    status: undefined,
    warnLevel: undefined,
    summary: undefined
  },
  rules: {
    sourceType: [{ required: true, message: "来源类型不能为空", trigger: "change" }],
    summary: [{ required: true, message: "线索摘要不能为空", trigger: "blur" }],
    deptId: [{ required: true, message: "承办部门不能为空", trigger: "change" }]
  },
  handleRules: {
    action: [{ required: true, message: "请选择流转动作", trigger: "change" }]
  }
})

const { queryParams, form, rules, handleForm, handleRules } = toRefs(data)

/** 按当前状态给出可执行的流转动作 */
const ACTIONS_BY_STATUS = {
  "0": [
    { value: "accept", label: "受理" },
    { value: "reject", label: "不予受理" }
  ],
  "1": [
    { value: "review", label: "研判" },
    { value: "assign", label: "分办" },
    { value: "reject", label: "不予受理" },
    { value: "return", label: "退回" }
  ],
  "2": [
    { value: "assign", label: "分办" },
    { value: "dispose", label: "处置" },
    { value: "reject", label: "不予受理" },
    { value: "return", label: "退回" }
  ],
  "3": [
    { value: "dispose", label: "处置" },
    { value: "close", label: "办结" },
    { value: "reject", label: "不予受理" },
    { value: "return", label: "退回" }
  ],
  "4": [],
  "5": []
}

const availableActions = computed(() => ACTIONS_BY_STATUS[currentClue.value.status] || [])

function statusLabel(v) {
  if (v === null || v === undefined || v === "") return "—"
  const d = (jc_clue_status.value || []).find(x => x.value === v)
  return d ? d.label : v
}

function getList() {
  loading.value = true
  listClue(queryParams.value).then(response => {
    clueList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getStat() {
  clueStatOverview().then(res => { stat.value = res.data || {} })
}

function getPersons() {
  listPerson({ pageNum: 1, pageSize: 1000 }).then(res => { personOptions.value = res.rows || [] })
}

function getDepts() {
  deptTreeSelect().then(res => { deptOptions.value = res.data })
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    clueId: undefined,
    clueNo: undefined,
    sourceType: undefined,
    violationType: undefined,
    personId: undefined,
    relatedPersons: undefined,
    summary: undefined,
    detail: undefined,
    deptId: undefined,
    sourceRef: undefined,
    remark: undefined
  }
  proxy.resetForm("clueRef")
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.clueId)
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "登记问题线索"
}

function handleUpdate(row) {
  reset()
  getClue(row.clueId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改问题线索"
  })
}

function submitForm() {
  proxy.$refs["clueRef"].validate(valid => {
    if (valid) {
      if (form.value.clueId != undefined) {
        updateClue(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addClue(form.value).then(() => {
          proxy.$modal.msgSuccess("登记成功")
          open.value = false
          getList()
          getStat()
        })
      }
    }
  })
}

function handleDelete(row) {
  const clueIds = row.clueId || ids.value
  proxy.$modal.confirm('是否确认删除线索编号为「' + (row.clueNo || '') + '」的数据？').then(function () {
    return delClue(clueIds)
  }).then(() => {
    getList()
    getStat()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 详情：拉取轨迹 + 重复线索 */
function handleDetail(row) {
  detailClue.value = {}
  traces.value = []
  duplicates.value = []
  detailOpen.value = true
  getClue(row.clueId).then(res => { detailClue.value = res.data || {} })
  getClueTrace(row.clueId).then(res => { traces.value = res.data || [] })
  if (row.personId) {
    detectDuplicate({ personId: row.personId, excludeClueId: row.clueId }).then(res => {
      duplicates.value = res.data || []
    })
  }
}

/** 打开流转对话框 */
function openHandle(row) {
  currentClue.value = row
  handleForm.value = { action: undefined, opinion: undefined, deptId: undefined, violationType: undefined, disposition: undefined }
  handleOpen.value = true
}

function submitHandle() {
  proxy.$refs["handleRef"].validate(valid => {
    if (valid) {
      handleClue(currentClue.value.clueId, handleForm.value).then(() => {
        proxy.$modal.msgSuccess("流转成功")
        handleOpen.value = false
        getList()
        getStat()
        if (detailOpen.value) {
          handleDetail(currentClue.value)
        }
      })
    }
  })
}

function handleRefreshWarn() {
  warnLoading.value = true
  refreshClueWarn().then(res => {
    proxy.$modal.msgSuccess("已刷新预警，更新 " + res.data + " 条")
    warnLoading.value = false
    getList()
    getStat()
  }).catch(() => { warnLoading.value = false })
}

function handleExport() {
  proxy.download("jiancha/clue/export", { ...queryParams.value }, `问题线索_${new Date().getTime()}.xlsx`)
}

getList()
getStat()
getPersons()
getDepts()
</script>

<style scoped>
.stat-card {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 14px 18px;
  border-left: 4px solid #409eff;
}
.stat-card.stat-warning { border-left-color: #e6a23c; }
.stat-card.stat-danger  { border-left-color: #f56c6c; }
.stat-card.stat-success { border-left-color: #67c23a; }
.stat-num {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  color: #303133;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin: 6px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.trace-title { font-size: 14px; color: #303133; }
.trace-sub { font-size: 12px; color: #909399; margin-top: 2px; }
</style>
