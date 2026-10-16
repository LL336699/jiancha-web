<template>
  <div class="app-container">
    <!-- 查询区：年度 / 类型 / 状态 / 申报人姓名 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="申报年度" prop="declareYear">
        <el-input-number v-model="queryParams.declareYear" :min="2020" :max="2100" controls-position="right" style="width: 120px" placeholder="年度" />
      </el-form-item>
      <el-form-item label="申报类型" prop="declareType">
        <el-select v-model="queryParams.declareType" placeholder="申报类型" clearable style="width: 140px">
          <el-option v-for="dict in jc_declare_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="申报状态" clearable style="width: 130px">
          <el-option v-for="dict in jc_declare_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="申报人" prop="personName">
        <el-input v-model="queryParams.personName" placeholder="姓名模糊搜索" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:archive:add']">新增申报</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['jiancha:archive:list']">导出年度清单</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="declareList">
      <el-table-column label="申报单号" align="center" prop="declareId" width="90" />
      <el-table-column label="申报人" align="center" prop="personName" width="100" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.personName || ('ID:' + scope.row.personId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所在部门" align="center" prop="personDept" width="130" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.personDept || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申报类型" align="center" prop="declareType" width="100">
        <template #default="scope">
          <dict-tag :options="jc_declare_type" :value="scope.row.declareType" />
        </template>
      </el-table-column>
      <el-table-column label="申报年度" align="center" prop="declareYear" width="90" />
      <el-table-column label="申报日期" align="center" prop="declareDate" width="115">
        <template #default="scope">
          <span>{{ parseTime(scope.row.declareDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :options="jc_declare_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="核实结论" align="center" prop="verifyResult" min-width="140" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ scope.row.verifyResult || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Tickets" @click="handleItems(scope.row)">事项</el-button>
          <el-button link type="primary" icon="Clock" @click="handleLog(scope.row)">留痕</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:archive:edit']">修改</el-button>
          <el-button v-if="scope.row.status !== '已核实'" link type="success" icon="Checked" @click="handleVerify(scope.row)" v-hasPermi="['jiancha:archive:edit']">核实</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:archive:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ==================== 新增/修改申报 ==================== -->
    <el-dialog :title="title" v-model="open" width="860px" append-to-body :close-on-click-modal="false">
      <el-form ref="declareRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="申报人" prop="personId">
              <div style="display: flex; gap: 8px; width: 100%">
                <el-input :model-value="personDisplay" placeholder="点击选择人员" readonly style="flex: 1" />
                <el-button type="primary" icon="User" @click="personPickerOpen = true">选择</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申报类型" prop="declareType">
              <el-select v-model="form.declareType" placeholder="请选择" style="width: 100%">
                <el-option v-for="dict in jc_declare_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="申报年度" prop="declareYear">
              <el-input-number v-model="form.declareYear" :min="2020" :max="2100" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申报日期" prop="declareDate">
              <el-date-picker v-model="form.declareDate" type="date" value-format="YYYY-MM-DD" placeholder="选择申报日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in jc_declare_status" :key="dict.value" :label="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入内容" />
        </el-form-item>
      </el-form>

      <!-- 申报事项内嵌维护 -->
      <el-divider content-position="left">
        申报事项明细
        <el-button type="primary" link icon="Plus" @click="addItemRow">添加事项</el-button>
      </el-divider>
      <el-table :data="itemRows" size="small" border empty-text="暂无事项，点击上方「添加事项」录入">
        <el-table-column label="事项类型" width="140">
          <template #default="scope">
            <el-select v-model="scope.row.itemType" placeholder="选择类型" size="small">
              <el-option v-for="dict in jc_conflict_item_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="内容描述" min-width="180">
          <template #default="scope">
            <el-input v-model="scope.row.itemDesc" size="small" placeholder="具体情形" />
          </template>
        </el-table-column>
        <el-table-column label="涉及企业" width="150">
          <template #default="scope">
            <el-input v-model="scope.row.entName" size="small" placeholder="企业/组织名称" />
          </template>
        </el-table-column>
        <el-table-column label="持股比例%" width="110">
          <template #default="scope">
            <el-input-number v-model="scope.row.holdRatio" :min="0" :max="100" :precision="2" controls-position="right" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="关联人" width="100">
          <template #default="scope">
            <el-input v-model="scope.row.relationPerson" size="small" placeholder="本人/亲属" />
          </template>
        </el-table-column>
        <el-table-column label="是否冲突" width="95">
          <template #default="scope">
            <el-switch v-model="scope.row.isConflict" active-value="1" inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="处理意见" min-width="140">
          <template #default="scope">
            <el-input v-model="scope.row.handleAdvice" size="small" placeholder="回避/退出/备案" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="scope">
            <el-button link type="danger" icon="Delete" @click="removeItemRow(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 人员选择器 ==================== -->
    <el-dialog title="选择申报人员" v-model="personPickerOpen" width="720px" append-to-body>
      <el-form :inline="true" @submit.prevent>
        <el-form-item>
          <el-input v-model="personQuery.name" placeholder="姓名/编号搜索" clearable style="width: 220px" @keyup.enter="searchPersons" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchPersons">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="personLoading" :data="personList" highlight-current-width @current-change="handlePersonPicked" size="small" border>
        <el-table-column label="姓名" prop="name" width="100" />
        <el-table-column label="人员编号" prop="personCode" width="140" />
        <el-table-column label="部门" prop="deptPath" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="岗位" prop="position" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="状态" prop="status" width="80" />
      </el-table>
      <pagination v-show="personTotal > 0" :total="personTotal" v-model:page="personQuery.pageNum" v-model:limit="personQuery.pageSize" @pagination="searchPersons" />
      <template #footer>
        <div class="dialog-footer">
          <span style="color: #909399; font-size: 12px">单击表格行即选中并返回</span>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 核实对话框 ==================== -->
    <el-dialog title="申报核实" v-model="verifyOpen" width="520px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        核实人与核实时间由系统自动记录；核实结论将写入申报单。
      </el-alert>
      <el-form ref="verifyRef" :model="verifyForm" label-width="100px">
        <el-form-item label="核实结论" prop="verifyResult">
          <el-select v-model="verifyForm.verifyResult" placeholder="请选择核实结论" style="width: 100%">
            <el-option label="属实" value="属实" />
            <el-option label="不属实" value="不属实" />
            <el-option label="存疑" value="存疑" />
          </el-select>
        </el-form-item>
        <el-form-item label="核实说明">
          <el-input v-model="verifyForm.verifyNote" type="textarea" :rows="3" placeholder="核实过程与结论说明（将与结论一并留存）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitVerify">确 定</el-button>
          <el-button @click="verifyOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ==================== 事项明细抽屉 ==================== -->
    <el-drawer v-model="itemOpen" :title="'申报事项明细（单号 ' + currentDeclareId + '）'" size="60%">
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        可直接在下方维护事项；保存后按全量替换更新。事项的批量新增/替换/删除均记入留痕。
      </el-alert>
      <el-row style="margin-bottom: 10px">
        <el-button type="warning" plain size="small" icon="Download" @click="handleExportItems">导出事项明细</el-button>
      </el-row>
      <el-table v-loading="itemLoading" :data="itemList" size="small" border>
        <el-table-column label="事项类型" align="center" prop="itemType" width="120">
          <template #default="scope">
            <dict-tag :options="jc_conflict_item_type" :value="scope.row.itemType" />
          </template>
        </el-table-column>
        <el-table-column label="内容描述" align="center" prop="itemDesc" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="涉及企业" align="center" prop="entName" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="持股比例%" align="center" prop="holdRatio" width="100" />
        <el-table-column label="关联人" align="center" prop="relationPerson" width="90" />
        <el-table-column label="是否冲突" align="center" prop="isConflict" width="85">
          <template #default="scope">
            <el-tag v-if="scope.row.isConflict === '1'" type="danger" size="small">是</el-tag>
            <el-tag v-else type="success" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="黑名单命中" align="center" prop="supplierBlack" width="100">
          <template #default="scope">
            <el-tooltip v-if="scope.row.supplierBlack === '1'" effect="dark" :content="'涉及企业在供应商库状态：' + (scope.row.supplierStatus === '4' ? '黑名单' : '禁入')" placement="top">
              <el-tag type="danger" size="small">黑名单</el-tag>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="处理意见" align="center" prop="handleAdvice" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="备注" align="center" prop="remark" min-width="100" :show-overflow-tooltip="true" />
      </el-table>
    </el-drawer>

    <!-- ==================== 变更留痕抽屉（段15） ==================== -->
    <el-drawer v-model="logOpen" :title="'变更留痕（单号 ' + currentLogDeclareId + '）'" size="42%">
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        申报单的新增、修改、核实、删除均自动留痕，满足"谁在何时改过什么"的审计追溯要求。
      </el-alert>
      <el-empty v-if="logList.length === 0 && !logLoading" description="暂无留痕记录" />
      <el-timeline v-else v-loading="logLoading" style="padding-left: 6px">
        <el-timeline-item
          v-for="log in logList"
          :key="log.logId"
          :timestamp="parseTime(log.operateTime)"
          placement="top"
          :type="logTypeColor(log.action)"
        >
          <el-card shadow="never" style="padding: 6px 10px">
            <div style="margin-bottom: 4px">
              <el-tag size="small" :type="logTypeColor(log.action)">{{ logActionLabel(log.action) }}</el-tag>
              <span style="margin-left: 8px; color: #606266; font-size: 13px">操作人：{{ log.operator || '-' }}</span>
            </div>
            <div style="color: #303133; font-size: 13px">{{ log.detail || '-' }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup name="Declare">
import { listDeclare, getDeclare, addDeclare, updateDeclare, delDeclare, verifyDeclare, listItemByDeclare, statDeclare, listUnDeclared, personStat, exportDeclare, replaceItems, listDeclareLog, exportItems } from "@/api/jiancha/declare"
import { listPerson as queryPersons } from "@/api/jiancha/person"

const { proxy } = getCurrentInstance()
const { jc_declare_type, jc_declare_status, jc_conflict_item_type } = useDict("jc_declare_type", "jc_declare_status", "jc_conflict_item_type")

const declareList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const verifyOpen = ref(false)
const verifyForm = ref({})
const itemOpen = ref(false)
const itemLoading = ref(false)
const itemList = ref([])
const currentDeclareId = ref(null)
const itemRows = ref([])
const isEdit = ref(false)

// 变更留痕抽屉（段15）
const logOpen = ref(false)
const logLoading = ref(false)
const logList = ref([])
const currentLogDeclareId = ref(null)

// 留痕动作显示
const LOG_ACTION_MAP = { add: "新增", edit: "修改", verify: "核实", delete: "删除" }
function logActionLabel(action) {
  return LOG_ACTION_MAP[action] || action
}
function logTypeColor(action) {
  const map = { add: "success", edit: "primary", verify: "warning", delete: "danger" }
  return map[action] || "info"
}

// 打开留痕抽屉
function handleLog(row) {
  currentLogDeclareId.value = row.declareId
  logOpen.value = true
  logLoading.value = true
  logList.value = []
  listDeclareLog(row.declareId).then(res => {
    logList.value = res.data || []
  }).finally(() => {
    logLoading.value = false
  })
}

// 导出当前申报单的事项明细（含黑名单命中列）
function handleExportItems() {
  proxy.download("jiancha/archive/declareItem/export/" + currentDeclareId.value, {}, "申报事项明细_" + currentDeclareId.value + ".xlsx")
}

// 人员选择器
const personPickerOpen = ref(false)
const personList = ref([])
const personLoading = ref(false)
const personTotal = ref(0)
const personQuery = ref({ pageNum: 1, pageSize: 8, name: undefined })
const personDisplay = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    declareYear: undefined,
    declareType: undefined,
    status: undefined,
    personName: undefined
  },
  rules: {
    personId: [{ required: true, message: "请选择申报人员", trigger: "change" }],
    declareType: [{ required: true, message: "请选择申报类型", trigger: "change" }],
    declareYear: [{ required: true, message: "请输入申报年度", trigger: "blur" }],
    status: [{ required: true, message: "请选择状态", trigger: "change" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listDeclare(queryParams.value).then(response => {
    declareList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    declareId: undefined,
    personId: undefined,
    personName: undefined,
    declareType: undefined,
    declareYear: new Date().getFullYear(),
    declareDate: undefined,
    status: "待核实",
    remark: undefined
  }
  personDisplay.value = ""
  itemRows.value = []
  proxy.resetForm("declareRef")
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
  reset()
  isEdit.value = false
  open.value = true
  title.value = "新增利益冲突申报"
}

function handleUpdate(row) {
  reset()
  isEdit.value = true
  getDeclare(row.declareId).then(response => {
    form.value = response.data
    personDisplay.value = (response.data.personName || "") + (response.data.personDept ? "（" + response.data.personDept + "）" : "")
    // 回填已有事项
    listItemByDeclare(row.declareId).then(res => {
      itemRows.value = (res.data || []).map(it => ({
        itemId: it.itemId,
        itemType: it.itemType,
        itemDesc: it.itemDesc,
        entName: it.entName,
        entCreditCode: it.entCreditCode,
        holdRatio: it.holdRatio,
        relationPerson: it.relationPerson,
        isConflict: it.isConflict || "0",
        handleAdvice: it.handleAdvice,
        remark: it.remark
      }))
    })
    open.value = true
    title.value = "修改利益冲突申报"
  })
}

function submitForm() {
  proxy.$refs["declareRef"].validate(valid => {
    if (!valid) return
    // 事项行基础校验：类型与描述必填
    for (let i = 0; i < itemRows.value.length; i++) {
      const it = itemRows.value[i]
      if (!it.itemType || !it.itemDesc) {
        proxy.$modal.msgWarning("第 " + (i + 1) + " 个事项的类型与内容描述不能为空")
        return
      }
    }
    const payload = Object.assign({}, form.value)
    const afterSave = (declareId) => {
      // 事项全量替换（新增时为空则跳过，修改时为空即清空）
      const items = itemRows.value.map(it => {
        const { itemId, ...rest } = it
        return rest
      })
      if (isEdit.value || items.length > 0) {
        return replaceItems(declareId, items)
      }
      return Promise.resolve()
    }
    if (payload.declareId != undefined) {
      updateDeclare(payload).then(() => afterSave(payload.declareId)).then(() => {
        proxy.$modal.msgSuccess("修改成功")
        open.value = false
        getList()
      })
    } else {
      addDeclare(payload).then(res => {
        const declareId = res.data
        return afterSave(declareId)
      }).then(() => {
        proxy.$modal.msgSuccess("新增成功")
        open.value = false
        getList()
      })
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除申报单号「' + row.declareId + '」？删除后事项明细一并失效。').then(function() {
    return delDeclare(row.declareId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 事项行操作 */
function addItemRow() {
  itemRows.value.push({
    itemType: undefined,
    itemDesc: undefined,
    entName: undefined,
    entCreditCode: undefined,
    holdRatio: undefined,
    relationPerson: "本人",
    isConflict: "0",
    handleAdvice: undefined,
    remark: undefined
  })
}

function removeItemRow(index) {
  itemRows.value.splice(index, 1)
}

/** 核实（说明与结论合并留存） */
function handleVerify(row) {
  verifyForm.value = { declareId: row.declareId, verifyResult: undefined, verifyNote: undefined }
  verifyOpen.value = true
}

function submitVerify() {
  if (!verifyForm.value.verifyResult) {
    proxy.$modal.msgWarning("请选择核实结论")
    return
  }
  const result = verifyForm.value.verifyNote
    ? verifyForm.value.verifyResult + "：" + verifyForm.value.verifyNote
    : verifyForm.value.verifyResult
  verifyDeclare({ declareId: verifyForm.value.declareId, verifyResult: result, status: "已核实" }).then(() => {
    proxy.$modal.msgSuccess("核实完成")
    verifyOpen.value = false
    getList()
  })
}

/** 事项明细抽屉 */
function handleItems(row) {
  currentDeclareId.value = row.declareId
  itemList.value = []
  itemOpen.value = true
  itemLoading.value = true
  listItemByDeclare(row.declareId).then(res => {
    itemList.value = res.data || []
    itemLoading.value = false
  })
}

/** 导出年度清单 */
function handleExport() {
  const year = queryParams.value.declareYear || new Date().getFullYear()
  proxy.download("jiancha/archive/declare/export", { year }, "利益冲突申报清单_" + year + ".xlsx")
}

/** 人员选择器 */
function searchPersons() {
  personLoading.value = true
  queryPersons(personQuery.value).then(response => {
    personList.value = response.rows
    personTotal.value = response.total
    personLoading.value = false
  })
}

function handlePersonPicked(row) {
  if (!row) return
  form.value.personId = row.personId
  personDisplay.value = row.name + (row.deptPath ? "（" + row.deptPath + "）" : "")
  personPickerOpen.value = false
}

watch(personPickerOpen, (val) => {
  if (val) {
    personQuery.value.pageNum = 1
    searchPersons()
  }
})

getList()
</script>
