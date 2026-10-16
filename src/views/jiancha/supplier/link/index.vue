<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="供应商" prop="supplierId">
        <el-select v-model="queryParams.supplierId" placeholder="全部" clearable filterable style="width: 220px">
          <el-option v-for="s in supplierOptions" :key="s.supplierId" :label="s.supplierName" :value="s.supplierId" />
        </el-select>
      </el-form-item>
      <el-form-item label="关联人员" prop="personName">
        <el-input v-model="queryParams.personName" placeholder="人员姓名关键字" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="关联类型" prop="linkType">
        <el-select v-model="queryParams.linkType" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_supplier_link_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="核实状态" prop="verifyStatus">
        <el-select v-model="queryParams.verifyStatus" placeholder="全部" clearable style="width: 130px">
          <el-option label="待核实" value="0" />
          <el-option label="已核实" value="1" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:supplier:link:add']">登记关联</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="RefreshLeft" @click="handleScan" v-hasPermi="['jiancha:supplier:link:scan']">系统比对</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 关联排查列表 ═══ -->
    <el-table v-loading="loading" :data="linkList">
      <el-table-column label="关联ID" align="center" prop="linkId" width="90" />
      <el-table-column label="供应商" align="left" prop="supplierName" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="关联人员" align="center" prop="personName" width="100" />
      <el-table-column label="关联类型" align="center" prop="linkType" width="110">
        <template #default="scope">
          <dict-tag :options="jc_supplier_link_type" :value="scope.row.linkType" />
        </template>
      </el-table-column>
      <el-table-column label="持股比例(%)" align="center" prop="holdRatio" width="120">
        <template #default="scope">
          <span v-if="scope.row.holdRatio != null">{{ scope.row.holdRatio }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" align="center" prop="sourceType" width="100">
        <template #default="scope">
          <dict-tag :options="jc_supplier_source" :value="scope.row.sourceType" />
        </template>
      </el-table-column>
      <el-table-column label="核实状态" align="center" prop="verifyStatus" width="100">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.verifyStatus === '1' ? 'success' : 'warning'">
            {{ scope.row.verifyStatus === '1' ? '已核实' : '待核实' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="处置结果" align="center" prop="handleResult" width="110">
        <template #default="scope">
          <dict-tag v-if="scope.row.handleResult" :options="jc_link_handle" :value="scope.row.handleResult" />
          <span v-else style="color:#c0c4cc">待处置</span>
        </template>
      </el-table-column>
      <el-table-column label="转整改单号" align="center" prop="issueNo" width="160">
        <template #default="scope">
          <span v-if="scope.row.issueNo">{{ scope.row.issueNo }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:supplier:link:query']">详情</el-button>
          <el-button link type="success" icon="Select" @click="openHandle(scope.row)" v-if="scope.row.verifyStatus !== '1'" v-hasPermi="['jiancha:supplier:link:handle']">处置</el-button>
          <el-button link type="warning" icon="RefreshRight" @click="openRectify(scope.row)" v-if="scope.row.handleResult === 'confirm' && !scope.row.issueNo" v-hasPermi="['jiancha:supplier:link:rectify']">转整改</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'关联排查详情 - ID ' + (detail.linkId || '')" size="55%">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="供应商" :span="2">{{ detail.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="关联人员">{{ detail.personName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="关联类型"><dict-tag :options="jc_supplier_link_type" :value="detail.linkType" /></el-descriptions-item>
        <el-descriptions-item label="持股比例(%)">{{ detail.holdRatio != null ? detail.holdRatio : '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源"><dict-tag :options="jc_supplier_source" :value="detail.sourceType" /></el-descriptions-item>
        <el-descriptions-item label="核实状态">
          <el-tag size="small" :type="detail.verifyStatus === '1' ? 'success' : 'warning'">
            {{ detail.verifyStatus === '1' ? '已核实' : '待核实' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处置结果">
          <dict-tag v-if="detail.handleResult" :options="jc_link_handle" :value="detail.handleResult" />
          <span v-else>待处置</span>
        </el-descriptions-item>
        <el-descriptions-item label="证据材料" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.evidence || '—' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="处置时间">{{ detail.handleTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="处置人">{{ detail.handleBy || '—' }}</el-descriptions-item>
        <el-descriptions-item label="处置意见" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.handleOpinion || '—' }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.issueNo" label="关联整改单号" :span="2">{{ detail.issueNo }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <!-- ═══ 登记关联对话框 ═══ -->
    <el-dialog title="登记供应商关联" v-model="formOpen" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable style="width: 100%">
            <el-option v-for="s in supplierOptions" :key="s.supplierId" :label="s.supplierName + '（' + s.supplierCode + '）'" :value="s.supplierId" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联人员" prop="personName">
          <el-input v-model="form.personName" placeholder="与供应商存在关联关系的内部人员姓名" style="width: 100%" />
        </el-form-item>
        <el-form-item label="关联人员ID" prop="personId">
          <el-input-number v-model="form.personId" :min="1" controls-position="right" placeholder="人员档案ID（可选）" style="width: 100%" />
        </el-form-item>
        <el-form-item label="关联类型" prop="linkType">
          <el-select v-model="form.linkType" placeholder="请选择关联类型" style="width: 100%">
            <el-option v-for="d in jc_supplier_link_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="持股比例(%)" prop="holdRatio">
          <el-input-number v-model="form.holdRatio" :min="0" :max="100" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="证据材料" prop="evidence">
          <el-input v-model="form.evidence" type="textarea" :rows="3" placeholder="关联关系的证据说明（工商信息、申报记录等）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="formOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 处置对话框 ═══ -->
    <el-dialog title="关联处置" v-model="handleOpen" width="500px" append-to-body>
      <el-form ref="handleRef" :model="handleForm" :rules="handleRules" label-width="100px">
        <el-form-item label="供应商">
          <span>{{ currentLink.supplierName }}</span>
        </el-form-item>
        <el-form-item label="关联人员">
          <span>{{ currentLink.personName }}</span>
        </el-form-item>
        <el-form-item label="处置结论" prop="handleResult">
          <el-radio-group v-model="handleForm.handleResult">
            <el-radio value="confirm">确认关联（属实）</el-radio>
            <el-radio value="exclude">排除（不成立）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处置意见" prop="opinion">
          <el-input v-model="handleForm.opinion" type="textarea" :rows="3" placeholder="填写核实情况与处置意见（将留痕）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitHandle">确认处置</el-button>
          <el-button @click="handleOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 转整改对话框 ═══ -->
    <el-dialog title="关联转整改" v-model="rectifyOpen" width="500px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        确认属实的关联关系将生成 E3 整改问题，进入整改闭环台账跟踪。
      </el-alert>
      <el-form ref="rectifyRef" :model="rectifyForm" :rules="rectifyRules" label-width="100px">
        <el-form-item label="供应商">
          <span>{{ currentLink.supplierName }}</span>
        </el-form-item>
        <el-form-item label="责任部门" prop="targetDeptId">
          <el-tree-select v-model="rectifyForm.targetDeptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="整改责任部门" clearable check-strictly style="width: 100%" />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="rectifyForm.severity" placeholder="请选择" style="width: 100%">
            <el-option label="一般" value="minor" />
            <el-option label="较重" value="major" />
            <el-option label="严重" value="serious" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改说明" prop="opinion">
          <el-input v-model="rectifyForm.opinion" type="textarea" :rows="3" placeholder="整改要求与说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRectify">生成整改问题</el-button>
          <el-button @click="rectifyOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SupplierLink">
import { listSupplier } from "@/api/jiancha/supplier"
import { listLink, getLink, addLink, handleLink, linkToRectify, scanLink } from "@/api/jiancha/supplier"
import { deptTreeSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { jc_supplier_link_type, jc_supplier_source, jc_link_handle } =
  useDict("jc_supplier_link_type", "jc_supplier_source", "jc_link_handle")

const linkList = ref([])
const supplierOptions = ref([])
const deptOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const formOpen = ref(false)
const handleOpen = ref(false)
const rectifyOpen = ref(false)
const currentLink = ref({})

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    supplierId: undefined,
    personName: undefined,
    linkType: undefined,
    verifyStatus: undefined
  },
  handleForm: { handleResult: "confirm", opinion: undefined },
  rectifyForm: { targetDeptId: undefined, severity: "major", opinion: undefined },
  formRules: {
    supplierId: [{ required: true, message: "请选择供应商", trigger: "change" }],
    personName: [{ required: true, message: "关联人员不能为空", trigger: "blur" }],
    linkType: [{ required: true, message: "请选择关联类型", trigger: "change" }]
  },
  handleRules: {
    handleResult: [{ required: true, message: "请选择处置结论", trigger: "change" }],
    opinion: [{ required: true, message: "处置意见不能为空", trigger: "blur" }]
  },
  rectifyRules: {
    targetDeptId: [{ required: true, message: "请选择整改责任部门", trigger: "change" }],
    opinion: [{ required: true, message: "整改说明不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, handleForm, rectifyForm, formRules, handleRules, rectifyRules } = toRefs(data)

function getList() {
  loading.value = true
  listLink(queryParams.value).then(response => {
    linkList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getSupplierOptions() {
  listSupplier({ pageNum: 1, pageSize: 500 }).then(res => {
    supplierOptions.value = res.rows || []
  })
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

function handleDetail(row) {
  detail.value = {}
  detailOpen.value = true
  getLink(row.linkId).then(res => { detail.value = res.data || {} })
}

function handleAdd() {
  form.value = { holdRatio: undefined, personId: undefined }
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      addLink(form.value).then(() => {
        proxy.$modal.msgSuccess("关联登记成功")
        formOpen.value = false
        getList()
      })
    }
  })
}

/** 系统比对：与人员利益冲突申报库自动扫描 */
function handleScan() {
  proxy.$modal.confirm("系统比对将扫描供应商库与利益冲突申报数据，自动生成关联线索，是否继续？").then(function () {
    return scanLink()
  }).then(res => {
    proxy.$modal.msgSuccess(res.msg || "比对完成")
    getList()
  }).catch(() => {})
}

function openHandle(row) {
  currentLink.value = row
  handleForm.value = { handleResult: "confirm", opinion: undefined }
  handleOpen.value = true
}

function submitHandle() {
  proxy.$refs["handleRef"].validate(valid => {
    if (valid) {
      handleLink(currentLink.value.linkId, handleForm.value).then(() => {
        proxy.$modal.msgSuccess("处置完成")
        handleOpen.value = false
        getList()
      })
    }
  })
}

function openRectify(row) {
  currentLink.value = row
  rectifyForm.value = { targetDeptId: undefined, severity: "major", opinion: undefined }
  rectifyOpen.value = true
}

function submitRectify() {
  proxy.$refs["rectifyRef"].validate(valid => {
    if (valid) {
      linkToRectify(currentLink.value.linkId, rectifyForm.value).then(res => {
        proxy.$modal.msgSuccess("已生成整改问题：" + (res.data || ""))
        rectifyOpen.value = false
        getList()
      })
    }
  })
}

getList()
getSupplierOptions()
getDepts()
</script>
