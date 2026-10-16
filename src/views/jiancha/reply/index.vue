<template>
  <div class="app-container">
    <!-- 查询区 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="申请编号" prop="requestNo">
        <el-input v-model="queryParams.requestNo" placeholder="编号模糊匹配" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="人员姓名" prop="personName">
        <el-input v-model="queryParams.personName" placeholder="姓名模糊匹配" clearable style="width: 140px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="事项类型" prop="matterType">
        <el-select v-model="queryParams.matterType" placeholder="全部" clearable style="width: 180px">
          <el-option v-for="d in jc_reply_matter" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="(label, value) in statusMap" :key="value" :label="label" :value="value" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请部门" prop="applyDept">
        <el-input v-model="queryParams.applyDept" placeholder="部门模糊匹配" clearable style="width: 150px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" @click="handleAdd" v-hasPermi="['jiancha:reply:add']">登记申请</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="el-icon-magic" :disabled="selectedIds.length === 0" @click="handleBatchScreen" v-hasPermi="['jiancha:reply:screen']">批量筛查</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="replyList" border fit @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="42" align="center" />
      <el-table-column label="编号" prop="requestNo" width="150" :show-overflow-tooltip="true" />
      <el-table-column label="人员" prop="personName" width="90" :show-overflow-tooltip="true" />
      <el-table-column label="部门" prop="personDept" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="事项类型" prop="matterType" width="120">
        <template #default="scope">
          <dict-tag :options="jc_reply_matter" :value="scope.row.matterType" />
        </template>
      </el-table-column>
      <el-table-column label="事项摘要" prop="matterDesc" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="申请部门" prop="applyDept" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="状态" prop="status" width="90" align="center">
        <template #default="scope">
          <el-tag :type="statusTagType[scope.row.status] || 'info'">{{ statusMap[scope.row.status] || scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="命中" prop="hitCount" width="60" align="center">
        <template #default="scope">
          <span v-if="scope.row.hitCount == null">—</span>
          <span v-else-if="scope.row.hitCount > 0" style="color:#F56C6C;font-weight:600">{{ scope.row.hitCount }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="筛查建议" prop="suggestResult" width="150" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.suggestResult || "—" }}</template>
      </el-table-column>
      <el-table-column label="剩余天数" prop="remainDays" width="90" align="center">
        <template #default="scope">
          <span v-if="scope.row.remainDays == null">—</span>
          <span v-else-if="scope.row.remainDays < 0" style="color:#F56C6C;font-weight:600">{{ scope.row.remainDays }}</span>
          <span v-else-if="scope.row.remainDays <= 3" style="color:#E6A23C;font-weight:600">{{ scope.row.remainDays }}</span>
          <span v-else>{{ scope.row.remainDays }}</span>
        </template>
      </el-table-column>
      <el-table-column label="回复结论" prop="finalResult" width="120" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.finalResult || "—" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="290" fixed="right" align="center">
        <template #default="scope">
          <el-button type="text" icon="el-icon-view" @click="handleDetail(scope.row)">详情</el-button>
          <el-button v-if="scope.row.status === '0'" type="text" icon="el-icon-magic" @click="handleScreen(scope.row)" v-hasPermi="['jiancha:reply:screen']">筛查</el-button>
          <el-button v-if="scope.row.status === '1'" type="text" icon="el-icon-chat-dot-round" @click="handleReply(scope.row)" v-hasPermi="['jiancha:reply:reply']">回复</el-button>
          <el-button v-if="scope.row.status === '1' || scope.row.status === '2'" type="text" icon="el-icon-close" @click="handleClose(scope.row)" v-hasPermi="['jiancha:reply:close']">关闭</el-button>
          <el-button v-if="scope.row.status === '0' || scope.row.status === '1'" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:reply:edit']">修改</el-button>
          <el-button v-if="scope.row.status === '0' || scope.row.status === '1'" type="text" icon="el-icon-delete" style="color:#F56C6C" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:reply:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 登记/修改弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="formOpen" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="人员" prop="personName">
              <div style="display:flex;gap:8px">
                <el-input v-model="form.personName" placeholder="点击右侧按钮选择" readonly style="flex:1" />
                <el-button icon="el-icon-search" @click="openPersonPicker" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人员部门" prop="personDept">
              <el-input v-model="form.personDept" placeholder="自动带出，可修改" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="事项类型" prop="matterType">
          <el-select v-model="form.matterType" placeholder="请选择事项类型" style="width:100%">
            <el-option v-for="d in jc_reply_matter" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item label="事项摘要" prop="matterDesc">
          <el-input v-model="form.matterDesc" type="textarea" :rows="2" placeholder="拟征求意见的具体事项" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="申请部门" prop="applyDept">
              <el-input v-model="form.applyDept" placeholder="征求意见的发文单位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="applyContact">
              <el-input v-model="form.applyContact" placeholder="对方联系人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="来文文号" prop="applyDocNo">
              <el-input v-model="form.applyDocNo" placeholder="如：X纪函〔2026〕12号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="办理时限(天)" prop="deadlineDays">
              <el-input-number v-model="form.deadlineDays" :min="1" :max="60" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="formOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog title="出具廉政意见" :visible.sync="replyOpen" width="620px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        申请人：{{ replyRow.personName }}（{{ replyRow.personDept }}）｜事项：{{ dictLabel(jc_reply_matter, replyRow.matterType) }}｜系统命中 {{ replyRow.hitCount || 0 }} 项
      </el-alert>
      <el-form ref="replyRef" :model="replyForm" :rules="replyRules" label-width="110px">
        <el-form-item label="回复结论" prop="finalResult">
          <el-radio-group v-model="replyForm.finalResult">
            <el-radio v-for="d in jc_reply_conclusion" :key="d.dictValue" :label="d.dictValue">{{ d.dictLabel }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复意见" prop="replyContent">
          <el-input v-model="replyForm.replyContent" type="textarea" :rows="4" placeholder="正式回复意见（作为回复正文）" />
        </el-form-item>
        <el-form-item label="研判备注" prop="opinion">
          <el-input v-model="replyForm.opinion" type="textarea" :rows="2" placeholder="选填：内部研判过程记录" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitReply">出具回复</el-button>
        <el-button @click="replyOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉（含筛查明细） -->
    <el-drawer title="廉政意见回复详情" :visible.sync="detailOpen" size="640px" append-to-body>
      <div v-loading="detailLoading" style="padding:0 16px 16px">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="编号">{{ detail.requestNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType[detail.status] || 'info'">{{ statusMap[detail.status] || detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="人员">{{ detail.personName }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ detail.personDept }}</el-descriptions-item>
          <el-descriptions-item label="事项类型">{{ dictLabel(jc_reply_matter, detail.matterType) }}</el-descriptions-item>
          <el-descriptions-item label="申请部门">{{ detail.applyDept }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail.applyContact || "—" }}</el-descriptions-item>
          <el-descriptions-item label="来文文号">{{ detail.applyDocNo || "—" }}</el-descriptions-item>
          <el-descriptions-item label="收文日期">{{ parseTime(detail.receiveDate, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="办理时限">{{ detail.deadlineDays }} 天</el-descriptions-item>
          <el-descriptions-item label="剩余天数">{{ detail.remainDays == null ? "—" : detail.remainDays }}</el-descriptions-item>
          <el-descriptions-item label="预警级别">{{ detail.warnLevel || "—" }}</el-descriptions-item>
          <el-descriptions-item label="事项摘要" :span="2">{{ detail.matterDesc }}</el-descriptions-item>
          <el-descriptions-item label="筛查建议" :span="2">{{ detail.suggestResult || "尚未筛查" }}</el-descriptions-item>
          <el-descriptions-item label="回复结论" :span="2">{{ detail.finalResult || "—" }}</el-descriptions-item>
          <el-descriptions-item label="回复内容" :span="2">{{ detail.replyContent || "—" }}</el-descriptions-item>
          <el-descriptions-item label="回复日期" :span="2">{{ detail.replyDate ? parseTime(detail.replyDate, "{y}-{m}-{d}") : "—" }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">系统筛查命中明细</el-divider>
        <el-table :data="screenItems" border size="mini" empty-text="暂无命中记录">
          <el-table-column label="来源模块" prop="sourceModule" width="110">
            <template #default="scope">{{ sourceModuleMap[scope.row.sourceModule] || scope.row.sourceModule }}</template>
          </el-table-column>
          <el-table-column label="来源单号" prop="sourceNo" width="150" :show-overflow-tooltip="true" />
          <el-table-column label="摘要" prop="summary" min-width="140" :show-overflow-tooltip="true" />
          <el-table-column label="来源状态" prop="sourceStatus" width="90" />
          <el-table-column label="风险权重" prop="riskWeight" width="90" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.riskWeight >= 3" type="danger" size="mini">{{ scope.row.riskWeight }}</el-tag>
              <el-tag v-else-if="scope.row.riskWeight >= 2" type="warning" size="mini">{{ scope.row.riskWeight }}</el-tag>
              <el-tag v-else type="info" size="mini">{{ scope.row.riskWeight }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="筛查时间" prop="screenTime" width="150">
            <template #default="scope">{{ parseTime(scope.row.screenTime, "{y}-{m}-{d} {h}:{i}") }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 人员选择弹窗 -->
    <el-dialog title="选择人员" :visible.sync="personOpen" width="620px" append-to-body>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <el-input v-model="personKeyword" placeholder="姓名/部门关键字" clearable style="width:260px" @keyup.enter.native="searchPersons" />
        <el-button type="primary" icon="el-icon-search" @click="searchPersons">检索</el-button>
      </div>
      <el-table v-loading="personLoading" :data="persons" border size="small" height="320" @row-dblclick="pickPerson">
        <el-table-column label="姓名" prop="personName" width="100" />
        <el-table-column label="部门" prop="personDept" min-width="120" />
        <el-table-column label="职务" prop="jobTitle" min-width="120" />
        <el-table-column label="操作" width="70" align="center">
          <template #default="scope">
            <el-button type="text" @click="pickPerson(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="ReplyIndex">
import {
  listReply, getReply, addReply, updateReply, delReply,
  screenReply, screenReplyBatch, replyRequest, closeReply, listScreenItems, searchReplyPersons
} from "@/api/jiancha/reply"

const { proxy } = getCurrentInstance()
const { jc_reply_matter, jc_reply_conclusion } = useDict("jc_reply_matter", "jc_reply_conclusion")

const replyList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const selectedIds = ref([])

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref({})
const screenItems = ref([])

const formOpen = ref(false)
const dialogTitle = ref("")
const form = ref({})

const replyOpen = ref(false)
const replyRow = ref({})
const replyForm = ref({ finalResult: "", replyContent: "", opinion: "" })

const personOpen = ref(false)
const personLoading = ref(false)
const personKeyword = ref("")
const persons = ref([])

const statusMap = { "0": "待筛查", "1": "已筛查", "2": "已回复", "3": "已关闭" }
const statusTagType = { "0": "warning", "1": "primary", "2": "success", "3": "info" }
const sourceModuleMap = { clue: "问题线索", petition: "信访举报", rectify: "整改台账", risk: "风险预警", supplier: "供应商关联", punish: "处分记录" }

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    requestNo: undefined,
    personName: undefined,
    matterType: undefined,
    status: undefined,
    applyDept: undefined
  },
  formRules: {
    personName: [{ required: true, message: "请选择人员", trigger: "change" }],
    matterType: [{ required: true, message: "请选择事项类型", trigger: "change" }],
    matterDesc: [{ required: true, message: "请填写事项摘要", trigger: "blur" }],
    applyDept: [{ required: true, message: "请填写申请部门", trigger: "blur" }],
    deadlineDays: [{ required: true, message: "请设置办理时限", trigger: "blur" }]
  },
  replyRules: {
    finalResult: [{ required: true, message: "请选择回复结论", trigger: "change" }],
    replyContent: [{ required: true, message: "请填写回复意见", trigger: "blur" }]
  }
})
const { queryParams, formRules, replyRules } = toRefs(data)

function getList() {
  loading.value = true
  listReply(queryParams.value).then(response => {
    replyList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleSelectionChange(sel) {
  selectedIds.value = sel.map(r => r.requestId)
}

function dictLabel(options, val) {
  const hit = (options || []).find(d => d.dictValue === val)
  return hit ? hit.dictLabel : (val || "—")
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleAdd() {
  form.value = { matterType: undefined, deadlineDays: 5 }
  dialogTitle.value = "登记廉政意见征求申请"
  formOpen.value = true
}

function handleUpdate(row) {
  form.value = Object.assign({}, row)
  dialogTitle.value = "修改申请 - " + row.requestNo
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.requestId != null) {
        updateReply(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          formOpen.value = false
          getList()
        })
      } else {
        addReply(form.value).then(() => {
          proxy.$modal.msgSuccess("登记成功")
          formOpen.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除申请「' + row.requestNo + '」？').then(function () {
    return delReply(row.requestId)
  }).then(() => {
    getList()
  }).catch(() => {})
}

/** 系统自动筛查：扫描六大来源，输出命中明细与建议结论 */
function handleScreen(row) {
  proxy.$modal.confirm('确认对「' + row.requestNo + '」执行系统自动筛查？系统将扫描问题线索/信访举报/整改台账/风险预警/供应商关联/处分记录六大来源。').then(function () {
    return screenReply(row.requestId)
  }).then(res => {
    const d = res.data || {}
    proxy.$modal.msgSuccess("筛查完成：命中 " + (d.hitCount || 0) + " 项" + (d.suggestResult ? "，建议：" + d.suggestResult : ""))
    getList()
  }).catch(() => {})
}

function handleBatchScreen() {
  proxy.$modal.confirm("确认对选中的 " + selectedIds.value.length + " 条申请批量执行系统筛查？").then(function () {
    return screenReplyBatch(selectedIds.value)
  }).then(() => {
    proxy.$modal.msgSuccess("批量筛查完成")
    getList()
  }).catch(() => {})
}

function handleReply(row) {
  replyRow.value = row
  replyForm.value = { finalResult: "", replyContent: "", opinion: "" }
  replyOpen.value = true
}

function submitReply() {
  proxy.$refs["replyRef"].validate(valid => {
    if (valid) {
      replyRequest(replyRow.value.requestId, replyForm.value).then(() => {
        proxy.$modal.msgSuccess("已出具回复意见")
        replyOpen.value = false
        getList()
      })
    }
  })
}

function handleClose(row) {
  proxy.$modal.confirm('确认关闭申请「' + row.requestNo + '」？关闭后不再办理。').then(function () {
    return closeReply(row.requestId)
  }).then(() => {
    proxy.$modal.msgSuccess("已关闭")
    getList()
  }).catch(() => {})
}

/** 详情：申请全字段 + 系统筛查命中明细 */
function handleDetail(row) {
  detail.value = {}
  screenItems.value = []
  detailOpen.value = true
  detailLoading.value = true
  getReply(row.requestId).then(res => {
    detail.value = res.data || {}
    return listScreenItems(row.requestId)
  }).then(res => {
    screenItems.value = res.data || []
    detailLoading.value = false
  }).catch(() => { detailLoading.value = false })
}

function openPersonPicker() {
  personOpen.value = true
  personKeyword.value = ""
  persons.value = []
}

function searchPersons() {
  personLoading.value = true
  searchReplyPersons(personKeyword.value).then(res => {
    persons.value = res.data || []
    personLoading.value = false
  }).catch(() => { personLoading.value = false })
}

function pickPerson(row) {
  form.value.personId = row.personId
  form.value.personName = row.personName
  form.value.personDept = row.personDept || ""
  personOpen.value = false
}

getList()
</script>

<style scoped>
.mb8 { margin-bottom: 8px; }
</style>
