<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="题干预乱" prop="category">
        <el-select v-model="queryParams.category" placeholder="全部" clearable style="width: 150px">
          <el-option v-for="d in jc_kb_cat_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="题型" prop="qtype">
        <el-select v-model="queryParams.qtype" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="d in jc_edu_qtype" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="难度" prop="level">
        <el-select v-model="queryParams.level" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="d in jc_edu_qlevel" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="题干关键字" prop="title">
        <el-input v-model="queryParams.title" placeholder="题干包含" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
          <el-option label="启用" value="0" />
          <el-option label="停用" value="1" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:edu:question:add']">新增题目</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="!selectedIds.length" @click="handleBatchDelete" v-hasPermi="['jiancha:edu:question:remove']">批量删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 题库列表 ═══ -->
    <el-table v-loading="loading" :data="questionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="题目ID" align="center" prop="questionId" width="90" />
      <el-table-column label="类别" align="center" prop="category" width="100">
        <template #default="scope">
          <dict-tag :options="jc_kb_cat_type" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column label="题型" align="center" prop="qtype" width="90">
        <template #default="scope">
          <dict-tag :options="jc_edu_qtype" :value="scope.row.qtype" />
        </template>
      </el-table-column>
      <el-table-column label="难度" align="center" prop="level" width="80">
        <template #default="scope">
          <dict-tag :options="jc_edu_qlevel" :value="scope.row.level" />
        </template>
      </el-table-column>
      <el-table-column label="题干" align="left" prop="title" :show-overflow-tooltip="true" min-width="300" />
      <el-table-column label="分值" align="center" prop="score" width="70" />
      <el-table-column label="被引用" align="center" prop="useCount" width="90" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.status === '0' ? 'success' : 'info'">
            {{ scope.row.status === '0' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:edu:question:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:edu:question:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:edu:question:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'题目详情 - ID ' + (detail.questionId || '')" size="50%">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="类别"><dict-tag :options="jc_kb_cat_type" :value="detail.category" /></el-descriptions-item>
        <el-descriptions-item label="题型"><dict-tag :options="jc_edu_qtype" :value="detail.qtype" /></el-descriptions-item>
        <el-descriptions-item label="难度"><dict-tag :options="jc_edu_qlevel" :value="detail.level" /></el-descriptions-item>
        <el-descriptions-item label="分值">{{ detail.score }}</el-descriptions-item>
        <el-descriptions-item label="被引用次数">{{ detail.useCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="detail.status === '0' ? 'success' : 'info'">{{ detail.status === '0' ? '启用' : '停用' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="题干" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.title }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="选项" :span="2">
          <div v-for="(opt, i) in parseOptions(detail.options)" :key="i" style="line-height: 1.8">{{ opt }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="正确答案" :span="2">
          <el-tag type="success" size="small">{{ detail.answer }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.analysis" label="解析" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.analysis }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <!-- ═══ 新增/修改对话框 ═══ -->
    <el-dialog :title="dialogTitle" v-model="formOpen" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="类别" prop="category">
              <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
                <el-option v-for="d in jc_kb_cat_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题型" prop="qtype">
              <el-select v-model="form.qtype" placeholder="请选择" style="width: 100%" @change="handleQtypeChange">
                <el-option v-for="d in jc_edu_qtype" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度" prop="level">
              <el-select v-model="form.level" placeholder="请选择" style="width: 100%">
                <el-option v-for="d in jc_edu_qlevel" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="题干" prop="title">
          <el-input v-model="form.title" type="textarea" :rows="2" placeholder="请输入题干" />
        </el-form-item>
        <el-form-item label="选项" prop="options">
          <el-input v-model="form.options" type="textarea" :rows="4" placeholder="每行一个选项，格式如：A.选项内容（判断题自动填充 A.正确|B.错误）" />
          <div class="form-tip">选项以竖线 | 分隔，如 A.选项一|B.选项二|C.选项三|D.选项四</div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="正确答案" prop="answer">
              <el-input v-model="form.answer" placeholder="如 A 或 AB" maxlength="10" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分值" prop="score">
              <el-input-number v-model="form.score" :min="1" :max="100" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="启用" value="0" />
                <el-option label="停用" value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="解析" prop="analysis">
          <el-input v-model="form.analysis" type="textarea" :rows="2" placeholder="答案解析（可选，考试后展示给参考人）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="formOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="EduQuestion">
import { listQuestion, getQuestion, addQuestion, updateQuestion, delQuestion } from "@/api/jiancha/edu"

const { proxy } = getCurrentInstance()
const { jc_kb_cat_type, jc_edu_qtype, jc_edu_qlevel } =
  useDict("jc_kb_cat_type", "jc_edu_qtype", "jc_edu_qlevel")

const questionList = ref([])
const selectedIds = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const formOpen = ref(false)
const dialogTitle = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    category: undefined,
    qtype: undefined,
    level: undefined,
    title: undefined,
    status: undefined
  },
  formRules: {
    category: [{ required: true, message: "类别不能为空", trigger: "change" }],
    qtype: [{ required: true, message: "题型不能为空", trigger: "change" }],
    level: [{ required: true, message: "难度不能为空", trigger: "change" }],
    title: [{ required: true, message: "题干不能为空", trigger: "blur" }],
    options: [{ required: true, message: "选项不能为空", trigger: "blur" }],
    answer: [{ required: true, message: "正确答案不能为空", trigger: "blur" }],
    score: [{ required: true, message: "分值不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, formRules } = toRefs(data)

/** 竖线分隔的选项拆为数组展示 */
function parseOptions(options) {
  if (!options) return []
  return options.split("|").filter(o => o && o.trim())
}

/** 切到判断题时自动填充标准选项 */
function handleQtypeChange(qtype) {
  if (qtype === "judge" && !form.value.options) {
    form.value.options = "A.正确|B.错误"
  }
}

function getList() {
  loading.value = true
  listQuestion(queryParams.value).then(response => {
    questionList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.questionId)
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
  getQuestion(row.questionId).then(res => { detail.value = res.data || {} })
}

function handleAdd() {
  form.value = { score: 5, status: "0", options: undefined }
  dialogTitle.value = "新增题目"
  formOpen.value = true
}

function handleUpdate(row) {
  form.value = Object.assign({}, row)
  dialogTitle.value = "修改题目 - ID " + row.questionId
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.questionId != null) {
        updateQuestion(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          formOpen.value = false
          getList()
        })
      } else {
        addQuestion(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          formOpen.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除题目ID为「' + row.questionId + '」的数据？已被试卷引用的题目不建议删除。').then(function () {
    return delQuestion(row.questionId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleBatchDelete() {
  proxy.$modal.confirm('是否确认删除选中的 ' + selectedIds.value.length + ' 条题目？').then(function () {
    return delQuestion(selectedIds.value.join(","))
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
</style>
