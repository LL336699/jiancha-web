<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="参考人" prop="personName">
        <el-input v-model="queryParams.personName" placeholder="姓名关键字" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="试卷" prop="paperName">
        <el-input v-model="queryParams.paperName" placeholder="试卷名称关键字" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="考试状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="d in jc_edu_exam_status" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否通过" prop="passed">
        <el-select v-model="queryParams.passed" placeholder="全部" clearable style="width: 110px">
          <el-option label="通过" value="1" />
          <el-option label="未通过" value="0" />
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
        <el-button type="primary" plain icon="VideoPlay" @click="openStart" v-hasPermi="['jiancha:edu:exam:start']">开考</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataBoard" @click="$router.push('/jiancha/edu/stat')">教育看板</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 考试记录列表 ═══ -->
    <el-table v-loading="loading" :data="examList">
      <el-table-column label="考试ID" align="center" prop="examId" width="90" />
      <el-table-column label="试卷编号" align="center" prop="paperCode" width="160" />
      <el-table-column label="试卷名称" align="left" prop="paperName" :show-overflow-tooltip="true" min-width="180" />
      <el-table-column label="参考人" align="center" prop="personName" width="100" />
      <el-table-column label="开考时间" align="center" prop="startTime" width="150" />
      <el-table-column label="交卷时间" align="center" prop="submitTime" width="150">
        <template #default="scope">
          <span v-if="scope.row.submitTime">{{ scope.row.submitTime }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="得分" align="center" width="90">
        <template #default="scope">
          <span v-if="scope.row.score != null" :style="{ color: scope.row.passed === '1' ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
            {{ scope.row.score }} / {{ scope.row.totalScore }}
          </span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="jc_edu_exam_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:edu:exam:query']">详情</el-button>
          <el-button link type="success" icon="EditPen" @click="openAnswer(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:edu:exam:submit']">答题</el-button>
          <el-button link type="danger" icon="CircleClose" @click="handleAbandon(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:edu:exam:submit']">弃考</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉（成绩 + 答题明细） ═══ -->
    <el-drawer v-model="detailOpen" :title="'考试详情 - ID ' + ((detail.exam && detail.exam.examId) || '')" size="65%">
      <template v-if="detail.exam">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 12px">
          <el-descriptions-item label="试卷">{{ detail.exam.paperName }}（{{ detail.exam.paperCode }}）</el-descriptions-item>
          <el-descriptions-item label="参考人">{{ detail.exam.personName }}</el-descriptions-item>
          <el-descriptions-item label="状态"><dict-tag :options="jc_edu_exam_status" :value="detail.exam.status" /></el-descriptions-item>
          <el-descriptions-item label="得分">
            <span v-if="detail.exam.score != null" :style="{ color: detail.exam.passed === '1' ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
              {{ detail.exam.score }} / {{ detail.exam.totalScore }}
            </span>
            <span v-else>—</span>
          </el-descriptions-item>
          <el-descriptions-item label="及格分">{{ detail.exam.passScore }}</el-descriptions-item>
          <el-descriptions-item label="是否通过">
            <el-tag size="small" :type="detail.exam.passed === '1' ? 'success' : 'danger'">
              {{ detail.exam.passed === '1' ? '通过' : '未通过' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开考时间" :span="3">{{ detail.exam.startTime }}</el-descriptions-item>
          <el-descriptions-item label="交卷时间" :span="3">{{ detail.exam.submitTime || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">答题明细（{{ (detail.answers || []).length }} 题）</div>
        <el-table :data="detail.answers || []" size="small" border>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="题型" prop="qtype" width="80" align="center">
            <template #default="scope">
              <dict-tag :options="jc_edu_qtype" :value="scope.row.qtype" />
            </template>
          </el-table-column>
          <el-table-column label="题干" prop="title" :show-overflow-tooltip="true" min-width="240" />
          <el-table-column label="我的答案" prop="myAnswer" width="90" align="center" />
          <el-table-column label="正确答案" prop="correct" width="90" align="center">
            <template #default="scope">
              <span style="color:#67c23a;font-weight:600">{{ scope.row.correct }}</span>
            </template>
          </el-table-column>
          <el-table-column label="得分" prop="score" width="70" align="center">
            <template #default="scope">
              <span :style="{ color: scope.row.score > 0 ? '#67c23a' : '#f56c6c' }">{{ scope.row.score }}</span>
            </template>
          </el-table-column>
          <el-table-column label="解析" prop="analysis" :show-overflow-tooltip="true" min-width="160" />
        </el-table>
      </template>
    </el-drawer>

    <!-- ═══ 开考对话框 ═══ -->
    <el-dialog title="开考" v-model="startOpen" width="500px" append-to-body>
      <el-form ref="startRef" :model="startForm" :rules="startRules" label-width="100px">
        <el-form-item label="选择试卷" prop="paperId">
          <el-select v-model="startForm.paperId" placeholder="仅显示已发布试卷" style="width: 100%">
            <el-option v-for="p in publishedPapers" :key="p.paperId" :label="p.paperName + '（' + p.paperCode + '）'" :value="p.paperId" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考人ID" prop="personId">
          <el-input-number v-model="startForm.personId" :min="1" controls-position="right" placeholder="人员档案ID" style="width: 100%" />
        </el-form-item>
        <el-form-item label="参考人姓名" prop="personName">
          <el-input v-model="startForm.personName" placeholder="参考人姓名" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitStart">开始考试</el-button>
          <el-button @click="startOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 答题对话框（开考后进入） ═══ -->
    <el-dialog title="在线答题" v-model="answerOpen" width="820px" append-to-body :close-on-click-modal="false">
      <div v-if="answeringExam">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px">
          {{ answeringExam.paperName }}｜总分 {{ answeringExam.totalScore }} 分｜及格 {{ answeringExam.passScore }} 分
          <span v-if="answerPersonName">｜参考人：{{ answerPersonName }}</span>
        </el-alert>
        <div v-for="(q, i) in answerQuestions" :key="q.questionId" class="question-block">
          <div class="question-title">
            <span class="q-index">{{ i + 1 }}.</span>
            <dict-tag :options="jc_edu_qtype" :value="q.qtype" />
            <span class="q-score">{{ q.score }}分</span>
            <span class="q-text">{{ q.title }}</span>
          </div>
          <div class="q-options">
            <div v-for="(opt, oi) in parseOptions(q.options)" :key="oi" class="q-option">{{ opt }}</div>
          </div>
          <div class="q-answer">
            <el-input v-model="answerSheet[q.questionId]" :placeholder="q.qtype === 'judge' ? '输入 A 或 B' : '输入选项字母，如 A 或 AB'" size="small" style="width: 220px" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAnswer">交卷</el-button>
          <el-button @click="answerOpen = false">稍后继续</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="EduExam">
import { listExam, getExam, startExam, submitExam, abandonExam, publishedPapers } from "@/api/jiancha/edu"

const { proxy } = getCurrentInstance()
const { jc_edu_qtype, jc_edu_exam_status } = useDict("jc_edu_qtype", "jc_edu_exam_status")

const examList = ref([])
const paperOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const startOpen = ref(false)
const answerOpen = ref(false)
const answeringExam = ref(null)
const answerPersonName = ref("")
const answerQuestions = ref([])
const answerSheet = ref({})

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    personName: undefined,
    paperName: undefined,
    status: undefined,
    passed: undefined
  },
  startForm: { paperId: undefined, personId: undefined, personName: undefined },
  startRules: {
    paperId: [{ required: true, message: "请选择试卷", trigger: "change" }],
    personId: [{ required: true, message: "参考人ID不能为空", trigger: "blur" }],
    personName: [{ required: true, message: "参考人姓名不能为空", trigger: "blur" }]
  }
})

const { queryParams, startForm, startRules } = toRefs(data)

function parseOptions(options) {
  if (!options) return []
  return options.split("|").filter(o => o && o.trim())
}

function getList() {
  loading.value = true
  listExam(queryParams.value).then(response => {
    examList.value = response.rows
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
  getExam(row.examId).then(res => { detail.value = res.data || {} })
}

/** 开考：选试卷与参考人，成功后直接进入答题界面 */
function openStart() {
  startForm.value = { paperId: undefined, personId: undefined, personName: undefined }
  if (!paperOptions.value.length) {
    publishedPapers().then(res => { paperOptions.value = res.data || [] })
  }
  startOpen.value = true
}

function submitStart() {
  proxy.$refs["startRef"].validate(valid => {
    if (valid) {
      startExam(startForm.value.paperId, startForm.value.personId, startForm.value.personName).then(res => {
        const exam = res.data || {}
        startOpen.value = false
        answerPersonName.value = startForm.value.personName
        enterAnswer(exam)
        getList()
      })
    }
  })
}

/** 进入答题界面：开考返回试卷题目（不含答案） */
function enterAnswer(exam) {
  answeringExam.value = exam
  answerQuestions.value = exam.questions || []
  answerSheet.value = {}
  answerOpen.value = true
}

/** 对进行中的考试继续答题：后端断点续考直接返回完整题目（含选项，不含答案） */
function openAnswer(row) {
  startExam(row.paperId, row.personId, row.personName).then(res => {
    answerPersonName.value = row.personName
    enterAnswer(res.data || {})
    // 回填已答答案
    getExam(row.examId).then(res2 => {
      const d = res2.data || {}
      ;(d.answers || []).forEach(a => {
        if (a.myAnswer) answerSheet.value[a.questionId] = a.myAnswer
      })
    })
  })
}

function submitAnswer() {
  const answers = Object.keys(answerSheet.value)
    .filter(k => answerSheet.value[k])
    .map(k => ({ questionId: Number(k), myAnswer: answerSheet.value[k] }))
  if (!answers.length) {
    proxy.$modal.msgError("请至少填写一道题的答案")
    return
  }
  proxy.$modal.confirm("确认交卷？交卷后自动评分，不可修改。").then(function () {
    return submitExam({ examId: answeringExam.value.examId, answers })
  }).then(() => {
    proxy.$modal.msgSuccess("交卷成功，已完成评分")
    answerOpen.value = false
    getList()
  }).catch(() => {})
}

function handleAbandon(row) {
  proxy.$modal.confirm('是否确认将「' + row.personName + '」的考试记为弃考？').then(function () {
    return abandonExam(row.examId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已记为弃考")
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
.question-block {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.question-title {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}
.q-index { font-weight: 600; margin-right: 6px; }
.q-score { color: #909399; font-size: 12px; margin: 0 8px; }
.q-options { margin: 8px 0 8px 22px; }
.q-option { line-height: 1.9; color: #606266; }
.q-answer { margin-left: 22px; }
</style>
