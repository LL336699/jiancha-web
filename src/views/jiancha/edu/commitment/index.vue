<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="承诺书标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="标题关键字" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="签收范围" prop="scopeType">
        <el-select v-model="queryParams.scopeType" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_edu_commit_scope" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="d in jc_edu_commit_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:edu:commitment:add']">新增承诺书</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataBoard" @click="$router.push('/jiancha/edu/stat')">教育看板</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 承诺书列表 ═══ -->
    <el-table v-loading="loading" :data="commitmentList">
      <el-table-column label="承诺书ID" align="center" prop="commitId" width="100" />
      <el-table-column label="标题" align="left" prop="title" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="签收范围" align="center" prop="scopeType" width="120">
        <template #default="scope">
          <dict-tag :options="jc_edu_commit_scope" :value="scope.row.scopeType" />
        </template>
      </el-table-column>
      <el-table-column label="签收截止" align="center" prop="deadline" width="120">
        <template #default="scope">
          <span v-if="scope.row.deadline && isExpired(scope.row.deadline)" style="color:#f56c6c">{{ scope.row.deadline }}（已截止）</span>
          <span v-else>{{ scope.row.deadline || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_edu_commit_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="签收人" align="center" prop="personName" width="100">
        <template #default="scope">
          <span v-if="scope.row.personName">{{ scope.row.personName }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="签收时间" align="center" prop="signTime" width="150">
        <template #default="scope">
          <span v-if="scope.row.signTime">{{ scope.row.signTime }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:edu:commitment:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:edu:commitment:edit']">修改</el-button>
          <el-button link type="success" icon="Promotion" @click="handlePublish(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:edu:commitment:publish']">发布</el-button>
          <el-button link type="warning" icon="CircleClose" @click="handleClose(scope.row)" v-if="scope.row.status === '1'" v-hasPermi="['jiancha:edu:commitment:publish']">关闭</el-button>
          <el-button link type="primary" icon="EditPen" @click="openSign(scope.row)" v-if="scope.row.status === '1' && !scope.row.personId" v-hasPermi="['jiancha:edu:commitment:sign']">签收</el-button>
          <el-button link type="info" icon="TrendCharts" @click="handleProgress(scope.row)" v-if="scope.row.status !== '0'" v-hasPermi="['jiancha:edu:commitment:query']">进度</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:edu:commitment:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'承诺书详情 - ' + (detail.title || '')" size="55%">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="标题" :span="2">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="签收范围"><dict-tag :options="jc_edu_commit_scope" :value="detail.scopeType" /></el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="jc_edu_commit_status" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="签收截止">{{ detail.deadline || '—' }}</el-descriptions-item>
        <el-descriptions-item label="签收人">{{ detail.personName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="签收时间">{{ detail.signTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="签收方式">{{ detail.signType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="承诺内容" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <!-- ═══ 签收进度抽屉 ═══ -->
    <el-drawer v-model="progressOpen" :title="'签收进度 - ' + (progressTitle || '')" size="55%">
      <el-descriptions :column="3" border size="small" style="margin-bottom: 12px" v-if="progressSummary">
        <el-descriptions-item label="应签收人数">{{ progressSummary.expected ?? progressSummary.total ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="已签收人数">{{ progressSummary.signed ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="签收率">
          <span :style="{ color: (progressSummary.signed || 0) >= (progressSummary.expected || 0) && progressSummary.expected ? '#67c23a' : '#e6a23c' }">
            {{ progressRate }}%
          </span>
        </el-descriptions-item>
      </el-descriptions>
      <div class="section-title">签收记录</div>
      <el-table v-if="progressRows.length" :data="progressRows" size="small" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="签收人" prop="personName" min-width="120" />
        <el-table-column label="签收时间" prop="signTime" width="160" align="center" />
        <el-table-column label="签收方式" prop="signType" width="100" align="center" />
      </el-table>
      <el-empty v-else description="暂无签收记录" :image-size="60" />
    </el-drawer>

    <!-- ═══ 新增/修改对话框 ═══ -->
    <el-dialog :title="dialogTitle" v-model="formOpen" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="承诺书标题，如《2026年度廉洁从业承诺书》" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="签收范围" prop="scopeType">
              <el-select v-model="form.scopeType" placeholder="请选择范围" style="width: 100%">
                <el-option v-for="d in jc_edu_commit_scope" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签收截止" prop="deadline">
              <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" placeholder="选择截止日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="承诺内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="承诺书正文内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="formOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 签收对话框 ═══ -->
    <el-dialog title="承诺书签收" v-model="signOpen" width="500px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        签收即表示本人已阅读并承诺遵守上述内容，签收记录留痕。
      </el-alert>
      <el-form ref="signRef" :model="signForm" :rules="signRules" label-width="100px">
        <el-form-item label="承诺书">
          <span>{{ currentCommitment.title }}</span>
        </el-form-item>
        <el-form-item label="签收人ID" prop="personId">
          <el-input-number v-model="signForm.personId" :min="1" controls-position="right" placeholder="人员档案ID" style="width: 100%" />
        </el-form-item>
        <el-form-item label="签收人姓名" prop="personName">
          <el-input v-model="signForm.personName" placeholder="签收人姓名" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitSign">确认签收</el-button>
          <el-button @click="signOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="EduCommitment">
import { listCommitment, getCommitment, addCommitment, updateCommitment, publishCommitment, closeCommitment, delCommitment, signCommitment, commitmentProgress } from "@/api/jiancha/edu"

const { proxy } = getCurrentInstance()
const { jc_edu_commit_scope, jc_edu_commit_status } = useDict("jc_edu_commit_scope", "jc_edu_commit_status")

const commitmentList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const progressOpen = ref(false)
const progressTitle = ref("")
const progressSummary = ref(null)
const progressRows = ref([])

const formOpen = ref(false)
const dialogTitle = ref("")

const signOpen = ref(false)
const currentCommitment = ref({})

const data = reactive({
  form: {},
  signForm: { personId: undefined, personName: undefined },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: undefined,
    scopeType: undefined,
    status: undefined
  },
  formRules: {
    title: [{ required: true, message: "标题不能为空", trigger: "blur" }],
    scopeType: [{ required: true, message: "签收范围不能为空", trigger: "change" }],
    content: [{ required: true, message: "承诺内容不能为空", trigger: "blur" }]
  },
  signRules: {
    personId: [{ required: true, message: "签收人ID不能为空", trigger: "blur" }],
    personName: [{ required: true, message: "签收人姓名不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, signForm, formRules, signRules } = toRefs(data)

const progressRate = computed(() => {
  const s = progressSummary.value || {}
  const expected = Number(s.expected ?? s.total ?? 0)
  const signed = Number(s.signed ?? 0)
  if (!expected) return "0.0"
  return (Math.round(signed * 1000 / expected) / 10).toFixed(1)
})

function isExpired(deadline) {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

function getList() {
  loading.value = true
  listCommitment(queryParams.value).then(response => {
    commitmentList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleDetail(row) {
  detail.value = {}
  detailOpen.value = true
  getCommitment(row.commitId).then(res => { detail.value = res.data || {} })
}

function handleAdd() {
  form.value = { scopeType: "all" }
  dialogTitle.value = "新增承诺书"
  formOpen.value = true
}

function handleUpdate(row) {
  form.value = Object.assign({}, row)
  dialogTitle.value = "修改承诺书 - " + row.title
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.commitId != null) {
        updateCommitment(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          formOpen.value = false
          getList()
        })
      } else {
        addCommitment(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          formOpen.value = false
          getList()
        })
      }
    }
  })
}

function handlePublish(row) {
  proxy.$modal.confirm('是否确认发布承诺书「' + row.title + '」？发布后相关人员可签收。').then(function () {
    return publishCommitment(row.commitId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已发布")
  }).catch(() => {})
}

function handleClose(row) {
  proxy.$modal.confirm('是否确认关闭承诺书「' + row.title + '」？').then(function () {
    return closeCommitment(row.commitId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已关闭")
  }).catch(() => {})
}

function openSign(row) {
  currentCommitment.value = row
  signForm.value = { personId: undefined, personName: undefined }
  signOpen.value = true
}

function submitSign() {
  proxy.$refs["signRef"].validate(valid => {
    if (valid) {
      signCommitment(currentCommitment.value.commitId, signForm.value.personId, signForm.value.personName).then(() => {
        proxy.$modal.msgSuccess("签收成功")
        signOpen.value = false
        getList()
      })
    }
  })
}

/** 签收进度：兼容 {summary, rows} / {expected,signed,records} / 纯数组三种返回 */
function handleProgress(row) {
  progressTitle.value = row.title
  progressSummary.value = null
  progressRows.value = []
  progressOpen.value = true
  commitmentProgress(row.commitId).then(res => {
    const d = res.data
    if (Array.isArray(d)) {
      progressRows.value = d
    } else if (d && typeof d === "object") {
      progressSummary.value = {
        expected: d.expected ?? d.total ?? d.expectCount,
        signed: d.signed ?? d.signCount
      }
      progressRows.value = d.rows || d.records || d.list || d.details || []
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除承诺书「' + row.title + '」？').then(function () {
    return delCommitment(row.commitId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin: 6px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
</style>
