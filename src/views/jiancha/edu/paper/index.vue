<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="试卷名称" prop="paperName">
        <el-input v-model="queryParams.paperName" placeholder="名称关键字" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="组卷方式" prop="paperMode">
        <el-select v-model="queryParams.paperMode" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="d in jc_edu_paper_mode" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="d in jc_edu_paper_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:edu:paper:add']">选题组卷</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="MagicStick" @click="randomOpen = true" v-hasPermi="['jiancha:edu:paper:random']">随机组卷</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 试卷列表 ═══ -->
    <el-table v-loading="loading" :data="paperList">
      <el-table-column label="试卷ID" align="center" prop="paperId" width="90" />
      <el-table-column label="试卷编号" align="center" prop="paperCode" width="160" />
      <el-table-column label="试卷名称" align="left" prop="paperName" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="组卷方式" align="center" prop="paperMode" width="100">
        <template #default="scope">
          <dict-tag :options="jc_edu_paper_mode" :value="scope.row.paperMode" />
        </template>
      </el-table-column>
      <el-table-column label="总分" align="center" prop="totalScore" width="80" />
      <el-table-column label="及格分" align="center" prop="passScore" width="80" />
      <el-table-column label="时长(分钟)" align="center" prop="durationMin" width="100" />
      <el-table-column label="题目数" align="center" width="90">
        <template #default="scope">{{ (scope.row.questions || []).length || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="jc_edu_paper_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="发布时间" align="center" prop="publishTime" width="150" />
      <el-table-column label="操作" width="280" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:edu:paper:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-if="scope.row.status !== '1'" v-hasPermi="['jiancha:edu:paper:edit']">修改</el-button>
          <el-button link type="success" icon="Promotion" @click="handlePublish(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:edu:paper:publish']">发布</el-button>
          <el-button link type="warning" icon="CircleClose" @click="handleClose(scope.row)" v-if="scope.row.status === '1'" v-hasPermi="['jiancha:edu:paper:publish']">关闭</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-if="scope.row.status !== '1'" v-hasPermi="['jiancha:edu:paper:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉（题目清单） ═══ -->
    <el-drawer v-model="detailOpen" :title="'试卷详情 - ' + (detail.paperName || '')" size="60%">
      <el-descriptions :column="3" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="试卷编号">{{ detail.paperCode }}</el-descriptions-item>
        <el-descriptions-item label="组卷方式"><dict-tag :options="jc_edu_paper_mode" :value="detail.paperMode" /></el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="jc_edu_paper_status" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="总分">{{ detail.totalScore }}</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ detail.passScore }}</el-descriptions-item>
        <el-descriptions-item label="时长(分钟)">{{ detail.durationMin }}</el-descriptions-item>
      </el-descriptions>
      <div class="section-title">题目清单（{{ (detail.questions || []).length }} 题）</div>
      <el-table :data="detail.questions || []" size="small" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="题型" prop="qtype" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="jc_edu_qtype" :value="scope.row.qtype" />
          </template>
        </el-table-column>
        <el-table-column label="题干" prop="titleSnapshot" :show-overflow-tooltip="true" min-width="300" />
        <el-table-column label="分值" prop="score" width="70" align="center" />
      </el-table>
    </el-drawer>

    <!-- ═══ 选题组卷对话框 ═══ -->
    <el-dialog title="选题组卷" v-model="formOpen" width="900px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px" style="margin-bottom: 8px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="试卷名称" prop="paperName">
              <el-input v-model="form.paperName" placeholder="试卷名称" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="组卷方式" prop="paperMode">
              <el-select v-model="form.paperMode" style="width: 100%">
                <el-option v-for="d in jc_edu_paper_mode" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="时长(分钟)" prop="durationMin">
              <el-input-number v-model="form.durationMin" :min="1" :max="300" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="及格分" prop="passScore">
              <el-input-number v-model="form.passScore" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="picker-bar">
        <span class="picker-title">从题库选题（已选 {{ selectedQuestions.length }} 题，合计 {{ selectedScore }} 分）</span>
        <el-button link type="primary" @click="getQuestionOptions">刷新题库</el-button>
      </div>
      <el-table ref="questionTableRef" v-loading="pickerLoading" :data="questionOptions" height="320" @selection-change="onQuestionSelect">
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="类别" prop="category" width="90" align="center">
          <template #default="scope"><dict-tag :options="jc_kb_cat_type" :value="scope.row.category" /></template>
        </el-table-column>
        <el-table-column label="题型" prop="qtype" width="80" align="center">
          <template #default="scope"><dict-tag :options="jc_edu_qtype" :value="scope.row.qtype" /></template>
        </el-table-column>
        <el-table-column label="题干" prop="title" :show-overflow-tooltip="true" min-width="320" />
        <el-table-column label="分值" prop="score" width="60" align="center" />
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确认组卷（总分 {{ selectedScore }}）</el-button>
          <el-button @click="formOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 随机组卷对话框 ═══ -->
    <el-dialog title="随机组卷" v-model="randomOpen" width="720px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        按类别/题型/数量规则从启用题库随机抽题，自动生成一份草稿试卷，发布前可修改。
      </el-alert>
      <el-form ref="randomRef" :model="randomForm" label-width="90px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="试卷名称" prop="paperName">
              <el-input v-model="randomForm.paperName" placeholder="随机试卷名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="时长(分钟)">
              <el-input-number v-model="randomForm.paper.durationMin" :min="1" :max="300" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="及格分">
              <el-input-number v-model="randomForm.paper.passScore" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="picker-bar">
        <span class="picker-title">抽题规则</span>
        <el-button link type="primary" icon="Plus" @click="addRule">添加规则</el-button>
      </div>
      <el-table :data="randomForm.rules" size="small" border>
        <el-table-column label="类别" width="180">
          <template #default="scope">
            <el-select v-model="scope.row.category" placeholder="全部" clearable size="small">
              <el-option v-for="d in jc_kb_cat_type" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="题型" width="160">
          <template #default="scope">
            <el-select v-model="scope.row.qtype" placeholder="全部" clearable size="small">
              <el-option v-for="d in jc_edu_qtype" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="抽取数量" width="140">
          <template #default="scope">
            <el-input-number v-model="scope.row.count" :min="1" :max="100" size="small" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="scope">
            <el-button link type="danger" icon="Delete" @click="removeRule(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRandom">生成随机试卷</el-button>
          <el-button @click="randomOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="EduPaper">
import { listPaper, getPaper, addPaper, randomPaper, publishPaper, closePaper, delPaper, listQuestion } from "@/api/jiancha/edu"

const { proxy } = getCurrentInstance()
const { jc_kb_cat_type, jc_edu_qtype, jc_edu_paper_mode, jc_edu_paper_status } =
  useDict("jc_kb_cat_type", "jc_edu_qtype", "jc_edu_paper_mode", "jc_edu_paper_status")

const paperList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const formOpen = ref(false)
const randomOpen = ref(false)

// 选题组卷的题库选择器
const questionOptions = ref([])
const pickerLoading = ref(false)
const selectedQuestions = ref([])
const selectedScore = computed(() => selectedQuestions.value.reduce((s, q) => s + (q.score || 0), 0))

const data = reactive({
  form: {},
  randomForm: {
    paperName: undefined,
    paper: { paperMode: "random", durationMin: 60, passScore: 60 },
    rules: [{ category: undefined, qtype: undefined, count: 5 }]
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    paperName: undefined,
    paperMode: undefined,
    status: undefined
  },
  formRules: {
    paperName: [{ required: true, message: "试卷名称不能为空", trigger: "blur" }],
    paperMode: [{ required: true, message: "组卷方式不能为空", trigger: "change" }],
    durationMin: [{ required: true, message: "时长不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, randomForm, formRules } = toRefs(data)

function getList() {
  loading.value = true
  listPaper(queryParams.value).then(response => {
    paperList.value = response.rows
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
  getPaper(row.paperId).then(res => { detail.value = res.data || {} })
}

/** 打开选题组卷：重置表单并加载题库 */
function handleAdd() {
  form.value = { paperMode: "manual", durationMin: 60, passScore: 60 }
  selectedQuestions.value = []
  formOpen.value = true
  getQuestionOptions()
}

function getQuestionOptions() {
  pickerLoading.value = true
  listQuestion({ pageNum: 1, pageSize: 500, status: "0" }).then(res => {
    questionOptions.value = res.rows || []
    pickerLoading.value = false
  })
}

function onQuestionSelect(selection) {
  selectedQuestions.value = selection
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (!selectedQuestions.value.length) {
        proxy.$modal.msgError("请至少选择一道题目")
        return
      }
      const payload = Object.assign({}, form.value, {
        totalScore: selectedScore.value,
        questions: selectedQuestions.value.map((q, i) => ({ questionId: q.questionId, sortNo: i + 1 }))
      })
      addPaper(payload).then(() => {
        proxy.$modal.msgSuccess("组卷成功")
        formOpen.value = false
        getList()
      })
    }
  })
}

function addRule() {
  randomForm.value.rules.push({ category: undefined, qtype: undefined, count: 5 })
}

function removeRule(index) {
  randomForm.value.rules.splice(index, 1)
}

function submitRandom() {
  if (!randomForm.value.paperName) {
    proxy.$modal.msgError("请填写试卷名称")
    return
  }
  if (!randomForm.value.rules.length) {
    proxy.$modal.msgError("请至少配置一条抽题规则")
    return
  }
  const totalCount = randomForm.value.rules.reduce((s, r) => s + (r.count || 0), 0)
  if (!totalCount) {
    proxy.$modal.msgError("抽题总数不能为 0")
    return
  }
  randomPaper(randomForm.value).then(() => {
    proxy.$modal.msgSuccess("随机试卷已生成，请核对后发布")
    randomOpen.value = false
    getList()
  })
}

function handlePublish(row) {
  proxy.$modal.confirm('是否确认发布试卷「' + row.paperName + '」？发布后可用于开考。').then(function () {
    return publishPaper(row.paperId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已发布")
  }).catch(() => {})
}

function handleClose(row) {
  proxy.$modal.confirm('是否确认关闭试卷「' + row.paperName + '」？关闭后不可再开考。').then(function () {
    return closePaper(row.paperId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已关闭")
  }).catch(() => {})
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除试卷「' + row.paperName + '」？').then(function () {
    return delPaper(row.paperId)
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
.picker-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.picker-title {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}
</style>
