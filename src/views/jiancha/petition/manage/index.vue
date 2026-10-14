<template>
  <div class="app-container">
    <!-- ═══ 统计概览 ═══ -->
    <el-row :gutter="12" class="mb8">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-num">{{ stat.total || 0 }}</div>
          <div class="stat-label">举报总量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ stat.pending || 0 }}</div>
          <div class="stat-label">待受理</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-num">{{ stat.handling || 0 }}</div>
          <div class="stat-label">办理中</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ stat.overdue || 0 }}</div>
          <div class="stat-label">超期（红灯）</div>
        </div>
      </el-col>
    </el-row>

    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="事由标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="标题关键字" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="被举报对象" prop="targetName">
        <el-input v-model="queryParams.targetName" placeholder="姓名关键字" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="舞弊类型" prop="category">
        <el-select v-model="queryParams.category" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_petition_category" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="办理状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="d in jc_petition_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="预警" prop="warnLevel">
        <el-select v-model="queryParams.warnLevel" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="d in jc_warn_level" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- ═══ 工具栏 ═══ -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="Position" @click="$router.push('/jiancha/petition/box')">举报箱入口</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 举报列表（不含内容与敏感字段） ═══ -->
    <el-table v-loading="loading" :data="petitionList">
      <el-table-column label="举报ID" align="center" prop="petitionId" width="90" />
      <el-table-column label="事由标题" align="left" prop="title" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="舞弊类型" align="center" prop="category" width="110">
        <template #default="scope">
          <dict-tag :options="jc_petition_category" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column label="被举报对象" align="center" prop="targetName" width="120">
        <template #default="scope">
          <span v-if="scope.row.targetName">{{ scope.row.targetName }}</span>
          <span v-else style="color:#c0c4cc">未指明</span>
        </template>
      </el-table-column>
      <el-table-column label="渠道" align="center" prop="channel" width="90">
        <template #default="scope">
          <dict-tag :options="jc_petition_channel" :value="scope.row.channel" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_petition_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="办理截止" align="center" prop="handleDeadline" width="150" />
      <el-table-column label="预警" align="center" prop="warnLevel" width="90">
        <template #default="scope">
          <dict-tag v-if="scope.row.warnLevel" :options="jc_warn_level" :value="scope.row.warnLevel" />
          <span v-else style="color:#c0c4cc">正常</span>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" align="center" prop="createTime" width="150" />
      <el-table-column label="操作" width="230" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:petition:query']">详情</el-button>
          <el-button link type="primary" icon="Promotion" @click="openHandle(scope.row)" v-hasPermi="['jiancha:petition:action']">流转</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:petition:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 举报详情抽屉（敏感字段解密展示） ═══ -->
    <el-drawer v-model="detailOpen" :title="'举报详情 - ID ' + (detailPetition.petitionId || '')" size="62%">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="事由标题" :span="2">{{ detailPetition.title }}</el-descriptions-item>
        <el-descriptions-item label="舞弊类型"><dict-tag :options="jc_petition_category" :value="detailPetition.category" /></el-descriptions-item>
        <el-descriptions-item label="提交渠道"><dict-tag :options="jc_petition_channel" :value="detailPetition.channel" /></el-descriptions-item>
        <el-descriptions-item label="实名/匿名">
          <el-tag size="small" :type="detailPetition.anonymousFlag === '0' ? 'warning' : 'info'">
            {{ detailPetition.anonymousFlag === '0' ? '实名' : '匿名' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="举报人姓名">{{ detailPetition.reporterName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="举报人电话">{{ detailPetition.reporterPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailPetition.reporterIdcard || '—' }}</el-descriptions-item>
        <el-descriptions-item label="被举报对象">{{ detailPetition.targetName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="对象所在部门">{{ detailPetition.targetDept || '—' }}</el-descriptions-item>
        <el-descriptions-item label="涉及金额(元)">{{ detailPetition.amount != null ? detailPetition.amount : '—' }}</el-descriptions-item>
        <el-descriptions-item label="办理状态"><dict-tag :options="jc_petition_status" :value="detailPetition.status" /></el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <dict-tag v-if="detailPetition.warnLevel" :options="jc_warn_level" :value="detailPetition.warnLevel" />
          <span v-else>正常</span>
        </el-descriptions-item>
        <el-descriptions-item label="办理截止">{{ detailPetition.handleDeadline || '—' }}</el-descriptions-item>
        <el-descriptions-item label="关联线索ID">{{ detailPetition.clueId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="举报内容" :span="2">
          <div style="white-space: pre-wrap;">{{ detailPetition.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailPetition.feedback" label="反馈内容（举报人凭回执码可见）" :span="2">
          <div style="white-space: pre-wrap;">{{ detailPetition.feedback }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间" :span="2">{{ detailPetition.createTime }}</el-descriptions-item>
      </el-descriptions>

      <el-alert v-if="duplicates.length" type="warning" :closable="false" style="margin-bottom: 12px">
        <div><b>同一被举报对象历史举报 {{ duplicates.length }} 条：</b></div>
        <div v-for="d in duplicates" :key="d.petitionId">· ID {{ d.petitionId }}｜{{ d.title }}（{{ d.createTime }}）</div>
        <div style="margin-top:4px;color:#909399">仅作提示，是否并案须人工研判。</div>
      </el-alert>

      <div class="section-title">补充材料</div>
      <el-table v-if="materials.length" :data="materials" size="small" border>
        <el-table-column label="文件名" prop="fileName" :show-overflow-tooltip="true" />
        <el-table-column label="大小(字节)" prop="fileSize" width="100" align="center" />
        <el-table-column label="上传时间" prop="createTime" width="150" align="center" />
      </el-table>
      <el-empty v-else description="暂无补充材料" :image-size="60" />

      <div class="section-title">办理轨迹（全程留痕）</div>
      <el-timeline v-if="traces.length" style="padding-left: 4px">
        <el-timeline-item v-for="t in traces" :key="t.traceId" :timestamp="t.createTime" placement="top" type="primary">
          <div class="trace-title">{{ t.actionDesc }}</div>
          <div class="trace-sub">
            {{ t.operator }}
            <span v-if="t.fromStatus || t.toStatus"> · {{ statusLabel(t.fromStatus) }} → {{ statusLabel(t.toStatus) }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无办理轨迹" :image-size="60" />

      <div style="margin-top: 16px">
        <el-button type="primary" icon="Promotion" @click="openHandle(detailPetition)" v-hasPermi="['jiancha:petition:action']">流转办理</el-button>
      </div>
    </el-drawer>

    <!-- ═══ 流转对话框 ═══ -->
    <el-dialog title="举报流转" v-model="handleOpen" width="600px" append-to-body>
      <el-form ref="handleRef" :model="handleForm" :rules="handleRules" label-width="100px">
        <el-form-item label="当前状态">
          <dict-tag :options="jc_petition_status" :value="currentPetition.status" />
        </el-form-item>
        <el-form-item label="流转动作" prop="action">
          <el-select v-model="handleForm.action" placeholder="请选择动作" style="width: 100%">
            <el-option v-for="a in availableActions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'dispatch'" label="承办部门" prop="deptId">
          <el-tree-select v-model="handleForm.deptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="分办转线索的承办部门" clearable check-strictly style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'feedback'" label="反馈内容" prop="feedback">
          <el-input v-model="handleForm.feedback" type="textarea" :rows="3" placeholder="向举报人反馈的办理结果（凭回执码可见）" />
        </el-form-item>
        <el-form-item label="办理意见" prop="opinion">
          <el-input v-model="handleForm.opinion" type="textarea" :rows="3" placeholder="填写办理意见、研判说明（将写入轨迹留痕）" />
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

<script setup name="PetitionManage">
import { listPetition, getPetition, getPetitionTrace, getPetitionMaterial, handlePetition, delPetition, detectDuplicatePetition, petitionStat } from "@/api/jiancha/petition"
import { deptTreeSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { jc_petition_status, jc_petition_category, jc_petition_channel, jc_warn_level } =
  useDict("jc_petition_status", "jc_petition_category", "jc_petition_channel", "jc_warn_level")

const petitionList = ref([])
const deptOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const stat = ref({})

const detailOpen = ref(false)
const detailPetition = ref({})
const traces = ref([])
const materials = ref([])
const duplicates = ref([])

const handleOpen = ref(false)
const currentPetition = ref({})

const data = reactive({
  form: {},
  handleForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: undefined,
    targetName: undefined,
    category: undefined,
    status: undefined,
    warnLevel: undefined
  },
  handleRules: {
    action: [{ required: true, message: "请选择流转动作", trigger: "change" }],
    deptId: [{ required: true, message: "请选择承办部门（转线索必填）", trigger: "change" }],
    feedback: [{ required: true, message: "请填写反馈内容", trigger: "blur" }]
  }
})

const { queryParams, handleForm, handleRules } = toRefs(data)

/** 按当前状态给出可执行的流转动作（与后端 ACTION_TARGET 状态机一致） */
const ACTIONS_BY_STATUS = {
  "0": [
    { value: "accept", label: "受理" },
    { value: "reject", label: "不予受理" }
  ],
  "1": [
    { value: "review", label: "研判" },
    { value: "dispatch", label: "分办（转线索）" },
    { value: "reject", label: "不予受理" }
  ],
  "2": [
    { value: "dispatch", label: "分办（转线索）" },
    { value: "reject", label: "不予受理" }
  ],
  "3": [
    { value: "handle", label: "办理" }
  ],
  "4": [
    { value: "feedback", label: "反馈" }
  ],
  "5": [
    { value: "archive", label: "归档" }
  ],
  "6": [],
  "7": []
}

const availableActions = computed(() => ACTIONS_BY_STATUS[currentPetition.value.status] || [])

function statusLabel(v) {
  if (v === null || v === undefined || v === "") return "—"
  const d = (jc_petition_status.value || []).find(x => x.value === v)
  return d ? d.label : v
}

function getList() {
  loading.value = true
  listPetition(queryParams.value).then(response => {
    petitionList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getStat() {
  petitionStat().then(res => { stat.value = res.data || {} })
}

function getDepts() {
  deptTreeSelect().then(res => { deptOptions.value = res.data })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 详情：解密字段 + 轨迹 + 材料 + 同对象历史 */
function handleDetail(row) {
  detailPetition.value = {}
  traces.value = []
  materials.value = []
  duplicates.value = []
  detailOpen.value = true
  getPetition(row.petitionId).then(res => { detailPetition.value = res.data || {} })
  getPetitionTrace(row.petitionId).then(res => { traces.value = res.data || [] })
  getPetitionMaterial(row.petitionId).then(res => { materials.value = res.data || [] })
  if (row.targetName) {
    detectDuplicatePetition(row.targetName).then(res => {
      duplicates.value = (res.data || []).filter(d => d.petitionId !== row.petitionId)
    })
  }
}

/** 打开流转对话框 */
function openHandle(row) {
  currentPetition.value = row
  handleForm.value = { action: undefined, opinion: undefined, deptId: undefined, feedback: undefined }
  handleOpen.value = true
}

function submitHandle() {
  proxy.$refs["handleRef"].validate(valid => {
    if (valid) {
      handlePetition(currentPetition.value.petitionId, handleForm.value).then(() => {
        proxy.$modal.msgSuccess("流转成功")
        handleOpen.value = false
        getList()
        getStat()
        if (detailOpen.value) {
          handleDetail(currentPetition.value)
        }
      })
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除举报ID为「' + row.petitionId + '」的数据？级联清理轨迹与材料，正式数据建议只归档不删除。').then(function () {
    return delPetition(row.petitionId)
  }).then(() => {
    getList()
    getStat()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
getStat()
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
.stat-card.stat-primary { border-left-color: #409eff; }
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
