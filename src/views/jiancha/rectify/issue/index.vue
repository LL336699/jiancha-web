<template>
  <div class="app-container">
    <!-- ═══ 统计概览 ═══ -->
    <el-row :gutter="12" class="mb8">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-num">{{ stat.total || 0 }}</div>
          <div class="stat-label">问题总量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ stat.pending || 0 }}</div>
          <div class="stat-label">待整改</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ stat.overdue || 0 }}</div>
          <div class="stat-label">超期（红灯）</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ stat.closed || 0 }}</div>
          <div class="stat-label">已销号（均 {{ stat.avgCloseDays || 0 }} 天）</div>
        </div>
      </el-col>
    </el-row>

    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="问题编号" prop="issueNo">
        <el-input v-model="queryParams.issueNo" placeholder="RX 编号" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="问题标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="标题关键字" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="来源" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="d in jc_rectify_source" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="严重程度" prop="severity">
        <el-select v-model="queryParams.severity" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="d in jc_rectify_severity" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="d in jc_rectify_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:rectify:add']">登记问题</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Share" @click="fromPetitionOpen = true" v-hasPermi="['jiancha:rectify:add']">举报转整改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataLine" @click="$router.push('/jiancha/rectify/stat')">整改统计</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 问题列表 ═══ -->
    <el-table v-loading="loading" :data="issueList">
      <el-table-column label="问题编号" align="center" prop="issueNo" width="150" />
      <el-table-column label="问题标题" align="left" prop="title" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="来源" align="center" prop="sourceType" width="100">
        <template #default="scope">
          <dict-tag :options="jc_rectify_source" :value="scope.row.sourceType" />
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="problemType" width="100">
        <template #default="scope">
          <dict-tag :options="jc_rectify_type" :value="scope.row.problemType" />
        </template>
      </el-table-column>
      <el-table-column label="严重程度" align="center" prop="severity" width="90">
        <template #default="scope">
          <dict-tag :options="jc_rectify_severity" :value="scope.row.severity" />
        </template>
      </el-table-column>
      <el-table-column label="责任部门" align="center" prop="deptName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="整改时限" align="center" prop="deadline" width="110" />
      <el-table-column label="剩余" align="center" prop="remainDays" width="90">
        <template #default="scope">
          <span v-if="scope.row.status === '3' || scope.row.status === '4'" style="color:#909399">—</span>
          <span v-else-if="scope.row.remainDays === null || scope.row.remainDays === undefined">未设</span>
          <span v-else-if="scope.row.remainDays < 0" style="color:#f56c6c">超期 {{ -scope.row.remainDays }} 天</span>
          <span v-else style="color:#67c23a">{{ scope.row.remainDays }} 天</span>
        </template>
      </el-table-column>
      <el-table-column label="措施" align="center" width="80">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.taskDoneCount >= scope.row.taskCount && scope.row.taskCount > 0 ? 'success' : 'info'">
            {{ scope.row.taskDoneCount || 0 }}/{{ scope.row.taskCount || 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="jc_rectify_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:rectify:query']">详情</el-button>
          <el-button link type="primary" icon="Promotion" @click="openHandle(scope.row)" v-hasPermi="['jiancha:rectify:action']">流转</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:rectify:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:rectify:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 登记 / 修改问题 ═══ -->
    <el-dialog :title="title" v-model="open" width="720px" append-to-body>
      <el-form ref="issueRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="问题来源" prop="sourceType">
              <el-select v-model="form.sourceType" placeholder="请选择来源" style="width: 100%">
                <el-option v-for="d in jc_rectify_source" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="问题类型" prop="problemType">
              <el-select v-model="form.problemType" placeholder="请选择类型" style="width: 100%">
                <el-option v-for="d in jc_rectify_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="严重程度" prop="severity">
              <el-select v-model="form.severity" placeholder="请选择严重程度" style="width: 100%">
                <el-option v-for="d in jc_rectify_severity" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源单号" prop="sourceRef">
              <el-input v-model="form.sourceRef" placeholder="审计报告号/举报ID等（同号幂等）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题标题" prop="title">
          <el-input v-model="form.title" placeholder="一句话概括问题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="问题事实、依据、影响" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="发现日期" prop="foundDate">
              <el-date-picker v-model="form.foundDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整改时限" prop="deadline">
              <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" placeholder="留空按发现日期+30天" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="责任部门" prop="targetDeptId">
              <el-tree-select v-model="form.targetDeptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择责任部门" clearable check-strictly style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人员ID" prop="targetPersonId">
              <el-input v-model="form.targetPersonId" placeholder="选填，廉洁档案人员ID" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="发现部门" prop="foundDept">
          <el-input v-model="form.foundDept" placeholder="选填，问题发现部门" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 举报转整改 ═══ -->
    <el-dialog title="从舞弊举报登记整改问题（幂等）" v-model="fromPetitionOpen" width="560px" append-to-body>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 10px">
        同一举报重复转整改将返回既有问题，不会重复创建。举报须已办理（分办转线索）后转整改效果最佳。
      </el-alert>
      <el-form ref="fromPetitionRef" :model="fromPetitionForm" :rules="fromPetitionRules" label-width="110px">
        <el-form-item label="举报ID" prop="petitionId">
          <el-input-number v-model="fromPetitionForm.petitionId" :min="1" :controls="false" style="width: 100%" placeholder="举报列表中的举报ID" />
        </el-form-item>
        <el-form-item label="责任部门" prop="targetDeptId">
          <el-tree-select v-model="fromPetitionForm.targetDeptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="请选择整改责任部门" clearable check-strictly style="width: 100%" />
        </el-form-item>
        <el-form-item label="问题类型" prop="problemType">
          <el-select v-model="fromPetitionForm.problemType" placeholder="请选择类型" clearable style="width: 100%">
            <el-option v-for="d in jc_rectify_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="fromPetitionForm.severity" placeholder="请选择严重程度" clearable style="width: 100%">
            <el-option v-for="d in jc_rectify_severity" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFromPetition">登记整改</el-button>
          <el-button @click="fromPetitionOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 问题详情抽屉（措施 + 复核记录） ═══ -->
    <el-drawer v-model="detailOpen" :title="'问题详情 - ' + (detailIssue.issueNo || '')" size="68%">
      <el-descriptions :column="3" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="来源"><dict-tag :options="jc_rectify_source" :value="detailIssue.sourceType" /></el-descriptions-item>
        <el-descriptions-item label="类型"><dict-tag :options="jc_rectify_type" :value="detailIssue.problemType" /></el-descriptions-item>
        <el-descriptions-item label="严重程度"><dict-tag :options="jc_rectify_severity" :value="detailIssue.severity" /></el-descriptions-item>
        <el-descriptions-item label="责任部门">{{ detailIssue.deptName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="责任人员">{{ detailIssue.personName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="jc_rectify_status" :value="detailIssue.status" /></el-descriptions-item>
        <el-descriptions-item label="发现日期">{{ detailIssue.foundDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="整改时限">{{ detailIssue.deadline || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ detailIssue.sourceRef || '—' }}</el-descriptions-item>
        <el-descriptions-item label="问题标题" :span="3">{{ detailIssue.title }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="3">
          <div style="white-space: pre-wrap;">{{ detailIssue.description || '—' }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailIssue.rectifySummary" label="整改小结" :span="3">
          <div style="white-space: pre-wrap;">{{ detailIssue.rectifySummary }}</div>
        </el-descriptions-item>
      </el-descriptions>

      <div class="section-title">
        整改措施（{{ doneTaskCount }}/{{ tasks.length }} 已完成，提交复核前至少须有一条已完成）
        <el-button link type="primary" icon="Plus" size="small" @click="openTaskDialog(null)" v-hasPermi="['jiancha:rectify:task']">新增措施</el-button>
      </div>
      <el-table :data="tasks" size="small" border>
        <el-table-column label="整改措施" prop="measure" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="责任人" prop="ownerName" width="90" align="center" />
        <el-table-column label="计划完成" prop="planDate" width="110" align="center" />
        <el-table-column label="实际完成" prop="doneDate" width="110" align="center" />
        <el-table-column label="状态" prop="status" width="80" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.status === '2' ? 'success' : (scope.row.status === '1' ? 'warning' : 'info')">
              {{ { '0': '未开始', '1': '进行中', '2': '已完成' }[scope.row.status] || scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" icon="Edit" @click="openTaskDialog(scope.row)" v-hasPermi="['jiancha:rectify:task']">编辑</el-button>
            <el-button link type="danger" size="small" icon="Delete" @click="removeTask(scope.row)" v-hasPermi="['jiancha:rectify:task']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="section-title">复核 / 回头看记录（全程留痕）</div>
      <el-table :data="reviews" size="small" border>
        <el-table-column label="类型" prop="reviewType" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.reviewType === '2' ? 'warning' : 'primary'">
              {{ scope.row.reviewType === '2' ? '回头看' : '销号复核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结论" prop="result" width="80" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.result === '1' ? 'success' : 'danger'">
              {{ scope.row.result === '1' ? '通过' : '不通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="复核意见" prop="opinion" :show-overflow-tooltip="true" min-width="180" />
        <el-table-column label="复核人" prop="reviewer" width="100" align="center" />
        <el-table-column label="复核时间" prop="reviewTime" width="150" align="center" />
      </el-table>
      <el-empty v-if="!reviews.length" description="暂无复核记录" :image-size="60" />

      <div style="margin-top: 16px">
        <el-button type="primary" icon="Promotion" @click="openHandle(detailIssue)" v-hasPermi="['jiancha:rectify:action']">流转办理</el-button>
      </div>
    </el-drawer>

    <!-- ═══ 措施编辑对话框 ═══ -->
    <el-dialog :title="taskTitle" v-model="taskOpen" width="600px" append-to-body>
      <el-form ref="taskRef" :model="taskForm" :rules="taskRules" label-width="110px">
        <el-form-item label="整改措施" prop="measure">
          <el-input v-model="taskForm.measure" type="textarea" :rows="3" placeholder="具体整改措施内容" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="责任人" prop="ownerName">
              <el-input v-model="taskForm.ownerName" placeholder="措施责任人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="措施状态" prop="status">
              <el-select v-model="taskForm.status" style="width: 100%">
                <el-option label="未开始" value="0" />
                <el-option label="进行中" value="1" />
                <el-option label="已完成" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="计划完成" prop="planDate">
              <el-date-picker v-model="taskForm.planDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际完成" prop="doneDate">
              <el-date-picker v-model="taskForm.doneDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitTask">确 定</el-button>
          <el-button @click="taskOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 流转对话框 ═══ -->
    <el-dialog title="整改流转" v-model="handleOpen" width="600px" append-to-body>
      <el-form ref="handleRef" :model="handleForm" :rules="handleRules" label-width="110px">
        <el-form-item label="当前状态">
          <dict-tag :options="jc_rectify_status" :value="currentIssue.status" />
        </el-form-item>
        <el-form-item label="流转动作" prop="action">
          <el-select v-model="handleForm.action" placeholder="请选择动作" style="width: 100%">
            <el-option v-for="a in availableActions" :key="a.value" :label="a.label" :value="a.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'revisit'" label="回头看的" prop="result">
          <el-radio-group v-model="handleForm.result">
            <el-radio value="1">通过（仅留痕）</el-radio>
            <el-radio value="0">不通过（重开问题）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="办理意见" prop="opinion">
          <el-input v-model="handleForm.opinion" type="textarea" :rows="3" placeholder="填写办理意见、复核说明（将写入复核记录留痕）" />
        </el-form-item>
        <el-alert v-if="handleForm.action === 'submit' && doneTaskCount === 0" type="warning" :closable="false" show-icon style="margin-top: 4px">
          当前无已完成措施，提交复核将被后端拒绝（防止零措施销号）。
        </el-alert>
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

<script setup name="RectifyIssue">
import {
  listRectifyIssue, getRectifyIssue, addRectifyIssue, updateRectifyIssue, delRectifyIssue,
  handleRectifyIssue, addRectifyFromPetition, rectifyStat,
  listRectifyTask, addRectifyTask, updateRectifyTask, delRectifyTask,
  listRectifyReview
} from "@/api/jiancha/rectify"
import { deptTreeSelect } from "@/api/system/user"
import { useRoute } from "vue-router"

const route = useRoute()
const { proxy } = getCurrentInstance()
const { jc_rectify_source, jc_rectify_type, jc_rectify_severity, jc_rectify_status } =
  useDict("jc_rectify_source", "jc_rectify_type", "jc_rectify_severity", "jc_rectify_status")

const issueList = ref([])
const deptOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const stat = ref({})

const open = ref(false)
const detailOpen = ref(false)
const detailIssue = ref({})
const tasks = ref([])
const reviews = ref([])
const doneTaskCount = computed(() => tasks.value.filter(t => t.status === '2').length)

const taskOpen = ref(false)
const taskTitle = ref("")
const taskForm = ref({})

const fromPetitionOpen = ref(false)
const fromPetitionForm = ref({ petitionId: undefined, targetDeptId: undefined, problemType: undefined, severity: undefined })

const handleOpen = ref(false)
const currentIssue = ref({})

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    issueNo: undefined,
    title: undefined,
    sourceType: undefined,
    severity: undefined,
    status: undefined
  },
  rules: {
    sourceType: [{ required: true, message: "请选择问题来源", trigger: "change" }],
    problemType: [{ required: true, message: "请选择问题类型", trigger: "change" }],
    severity: [{ required: true, message: "请选择严重程度", trigger: "change" }],
    title: [{ required: true, message: "请填写问题标题", trigger: "blur" }],
    description: [{ required: true, message: "请填写问题描述", trigger: "blur" }],
    targetDeptId: [{ required: true, message: "请选择责任部门", trigger: "change" }]
  },
  handleForm: {},
  handleRules: {
    action: [{ required: true, message: "请选择流转动作", trigger: "change" }]
  },
  fromPetitionRules: {
    petitionId: [{ required: true, message: "请输入举报ID", trigger: "blur" }],
    targetDeptId: [{ required: true, message: "请选择责任部门", trigger: "change" }]
  },
  taskRules: {
    measure: [{ required: true, message: "请填写整改措施内容", trigger: "blur" }],
    status: [{ required: true, message: "请选择措施状态", trigger: "change" }]
  }
})

const { queryParams, form, rules, handleForm, handleRules } = toRefs(data)

/** 按当前状态给出可执行的流转动作（与后端状态机一致） */
const ACTIONS_BY_STATUS = {
  "0": [
    { value: "start", label: "开始整改" },
    { value: "void", label: "作废（问题不成立）" }
  ],
  "1": [
    { value: "submit", label: "提交复核" },
    { value: "void", label: "作废" }
  ],
  "2": [
    { value: "pass", label: "销号（复核通过）" },
    { value: "reopen", label: "退回整改" }
  ],
  "3": [
    { value: "revisit", label: "回头看" }
  ],
  "4": []
}

const availableActions = computed(() => ACTIONS_BY_STATUS[currentIssue.value.status] || [])

function getList() {
  loading.value = true
  listRectifyIssue(queryParams.value).then(response => {
    issueList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getStat() {
  rectifyStat().then(res => { stat.value = res.data || {} })
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

function reset() {
  form.value = {
    issueId: undefined,
    issueNo: undefined,
    sourceType: undefined,
    sourceRef: undefined,
    title: undefined,
    description: undefined,
    problemType: undefined,
    severity: undefined,
    foundDate: undefined,
    foundDept: undefined,
    targetDeptId: undefined,
    targetPersonId: undefined,
    deadline: undefined,
    remark: undefined
  }
  proxy.resetForm("issueRef")
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "登记整改问题"
}

function handleUpdate(row) {
  reset()
  getRectifyIssue(row.issueId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改整改问题"
  })
}

function submitForm() {
  proxy.$refs["issueRef"].validate(valid => {
    if (valid) {
      if (form.value.issueId != undefined) {
        updateRectifyIssue(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addRectifyIssue(form.value).then(() => {
          proxy.$modal.msgSuccess("登记成功")
          open.value = false
          getList()
          getStat()
        })
      }
    }
  })
}

/** 详情：问题 + 措施 + 复核记录 */
function handleDetail(row) {
  detailIssue.value = {}
  tasks.value = []
  reviews.value = []
  detailOpen.value = true
  getRectifyIssue(row.issueId).then(res => { detailIssue.value = res.data || {} })
  listRectifyTask(row.issueId).then(res => { tasks.value = res.data || [] })
  listRectifyReview(row.issueId).then(res => { reviews.value = res.data || [] })
}

/** 措施编辑 */
function openTaskDialog(row) {
  if (row) {
    taskForm.value = { ...row }
    taskTitle.value = "修改整改措施"
  } else {
    taskForm.value = { issueId: detailIssue.value.issueId, measure: undefined, ownerName: undefined, planDate: undefined, doneDate: undefined, status: '0' }
    taskTitle.value = "新增整改措施"
  }
  taskOpen.value = true
}

function submitTask() {
  proxy.$refs["taskRef"].validate(valid => {
    if (valid) {
      if (taskForm.value.taskId != undefined) {
        updateRectifyTask(taskForm.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          taskOpen.value = false
          refreshDetail()
        })
      } else {
        addRectifyTask(taskForm.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          taskOpen.value = false
          refreshDetail()
        })
      }
    }
  })
}

function removeTask(row) {
  proxy.$modal.confirm('是否确认删除该整改措施？').then(function () {
    return delRectifyTask(row.taskId)
  }).then(() => {
    proxy.$modal.msgSuccess("删除成功")
    refreshDetail()
  }).catch(() => {})
}

/** 举报转整改（幂等） */
function submitFromPetition() {
  proxy.$refs["fromPetitionRef"].validate(valid => {
    if (valid) {
      addRectifyFromPetition(
        fromPetitionForm.value.petitionId,
        fromPetitionForm.value.targetDeptId,
        fromPetitionForm.value.problemType,
        fromPetitionForm.value.severity
      ).then(res => {
        proxy.$modal.msgSuccess("已登记整改问题 " + (res.data && res.data.issueNo))
        fromPetitionOpen.value = false
        getList()
        getStat()
      })
    }
  })
}

/** 打开流转对话框 */
function openHandle(row) {
  currentIssue.value = row
  handleForm.value = { action: undefined, opinion: undefined, result: '0' }
  handleOpen.value = true
}

function submitHandle() {
  proxy.$refs["handleRef"].validate(valid => {
    if (valid) {
      handleRectifyIssue(currentIssue.value.issueId, handleForm.value).then(() => {
        proxy.$modal.msgSuccess("流转成功")
        handleOpen.value = false
        getList()
        getStat()
        if (detailOpen.value) {
          handleDetail(currentIssue.value)
        }
      })
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除问题编号为「' + (row.issueNo || '') + '」的数据？级联清理措施与复核记录，正式数据建议只销号不删除。').then(function () {
    return delRectifyIssue(row.issueId)
  }).then(() => {
    getList()
    getStat()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 措施变动后刷新详情抽屉与列表（措施计数在列表列） */
function refreshDetail() {
  if (detailOpen.value && detailIssue.value.issueId) {
    listRectifyTask(detailIssue.value.issueId).then(res => { tasks.value = res.data || [] })
    listRectifyReview(detailIssue.value.issueId).then(res => { reviews.value = res.data || [] })
  }
  getList()
}

// 支持从风控预警页带 issueNo 跳转定位
if (route.query.issueNo) {
  queryParams.value.issueNo = route.query.issueNo
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
  margin: 10px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
</style>
