<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="申报年度" prop="declareYear">
        <el-input v-model="queryParams.declareYear" placeholder="如 2026" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="申报类型" prop="declareType">
        <el-select v-model="queryParams.declareType" placeholder="申报类型" clearable style="width: 160px">
          <el-option v-for="dict in jc_declare_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="申报状态" clearable style="width: 160px">
          <el-option v-for="dict in jc_declare_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:archive:add']">新增申报</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="declareList">
      <el-table-column label="申报单号" align="center" prop="declareId" width="90" />
      <el-table-column label="人员ID" align="center" prop="personId" width="90" />
      <el-table-column label="申报类型" align="center" prop="declareType" width="110">
        <template #default="scope">
          <dict-tag :options="jc_declare_type" :value="scope.row.declareType" />
        </template>
      </el-table-column>
      <el-table-column label="申报年度" align="center" prop="declareYear" width="90" />
      <el-table-column label="申报日期" align="center" prop="declareDate" width="120">
        <template #default="scope">
          <span>{{ parseTime(scope.row.declareDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_declare_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="核实人" align="center" prop="verifyBy" width="100" />
      <el-table-column label="核实结论" align="center" prop="verifyResult" :show-overflow-tooltip="true" />
      <el-table-column label="操作" width="240" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleItems(scope.row)">事项</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:archive:edit']">修改</el-button>
          <el-button v-if="scope.row.status !== '已核实'" link type="success" icon="Checked" @click="handleVerify(scope.row)" v-hasPermi="['jiancha:archive:edit']">核实</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:archive:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改申报 -->
    <el-dialog :title="title" v-model="open" width="560px" append-to-body>
      <el-form ref="declareRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="人员ID" prop="personId">
          <el-input-number v-model="form.personId" :min="1" controls-position="right" style="width: 100%" placeholder="档案中的人员编号" />
        </el-form-item>
        <el-form-item label="申报类型" prop="declareType">
          <el-select v-model="form.declareType" placeholder="请选择" style="width: 100%">
            <el-option v-for="dict in jc_declare_type" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报年度" prop="declareYear">
          <el-input-number v-model="form.declareYear" :min="2020" :max="2100" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="申报日期" prop="declareDate">
          <el-date-picker v-model="form.declareDate" type="date" value-format="YYYY-MM-DD" placeholder="选择申报日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
            <el-option v-for="dict in jc_declare_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 核实对话框 -->
    <el-dialog title="申报核实" v-model="verifyOpen" width="500px" append-to-body>
      <el-form ref="verifyRef" :model="verifyForm" label-width="90px">
        <el-form-item label="核实结论" prop="verifyResult">
          <el-select v-model="verifyForm.verifyResult" placeholder="请选择核实结论" style="width: 100%">
            <el-option label="属实" value="属实" />
            <el-option label="不属实" value="不属实" />
            <el-option label="存疑" value="存疑" />
          </el-select>
        </el-form-item>
        <el-form-item label="核实说明" prop="verifyNote">
          <el-input v-model="verifyForm.verifyNote" type="textarea" placeholder="核实过程与结论说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitVerify">确 定</el-button>
          <el-button @click="verifyOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 事项明细抽屉 -->
    <el-drawer v-model="itemOpen" title="申报事项明细" size="55%">
      <el-table :data="itemList" size="small" border>
        <el-table-column label="事项类型" align="center" prop="itemType" width="130" />
        <el-table-column label="内容描述" align="center" prop="content" :show-overflow-tooltip="true" />
        <el-table-column label="涉及企业" align="center" prop="entName" :show-overflow-tooltip="true" />
        <el-table-column label="核实状态" align="center" prop="verifyStatus" width="100" />
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup name="Declare">
import { listDeclare, getDeclare, addDeclare, updateDeclare, delDeclare, verifyDeclare, listItemByDeclare } from "@/api/jiancha/declare"

const { proxy } = getCurrentInstance()
const { jc_declare_type, jc_declare_status } = useDict("jc_declare_type", "jc_declare_status")

const declareList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const verifyOpen = ref(false)
const verifyForm = ref({})
const itemOpen = ref(false)
const itemList = ref([])

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    declareYear: undefined,
    declareType: undefined,
    status: undefined
  },
  rules: {
    personId: [{ required: true, message: "人员ID不能为空", trigger: "blur" }],
    declareType: [{ required: true, message: "申报类型不能为空", trigger: "change" }],
    declareYear: [{ required: true, message: "申报年度不能为空", trigger: "blur" }],
    status: [{ required: true, message: "状态不能为空", trigger: "change" }]
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
    declareType: undefined,
    declareYear: new Date().getFullYear(),
    declareDate: undefined,
    status: "待核实",
    remark: undefined
  }
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
  open.value = true
  title.value = "新增利益冲突申报"
}

function handleUpdate(row) {
  reset()
  getDeclare(row.declareId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改利益冲突申报"
  })
}

function submitForm() {
  proxy.$refs["declareRef"].validate(valid => {
    if (valid) {
      if (form.value.declareId != undefined) {
        updateDeclare(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDeclare(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除申报单号「' + row.declareId + '」？').then(function() {
    return delDeclare(row.declareId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 核实 */
function handleVerify(row) {
  verifyForm.value = { declareId: row.declareId, verifyResult: undefined, verifyNote: undefined }
  verifyOpen.value = true
}

function submitVerify() {
  if (!verifyForm.value.verifyResult) {
    proxy.$modal.msgWarning("请选择核实结论")
    return
  }
  // 后端 verify 自动写核实人与时间；结论同步落 verifyResult，状态置为已核实
  verifyDeclare({ declareId: verifyForm.value.declareId, verifyResult: verifyForm.value.verifyResult, status: "已核实" }).then(() => {
    proxy.$modal.msgSuccess("核实完成")
    verifyOpen.value = false
    getList()
  })
}

/** 事项明细 */
function handleItems(row) {
  itemList.value = []
  itemOpen.value = true
  listItemByDeclare(row.declareId).then(res => {
    itemList.value = res.data || []
  })
}

getList()
</script>
