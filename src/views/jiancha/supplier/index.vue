<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="供应商名称" prop="supplierName">
        <el-input v-model="queryParams.supplierName" placeholder="名称关键字" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="统一社会信用代码" prop="creditCode">
        <el-input v-model="queryParams.creditCode" placeholder="信用代码" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="供应类别" prop="category">
        <el-select v-model="queryParams.category" placeholder="全部" clearable style="width: 150px">
          <el-option v-for="d in jc_supplier_category" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="档案状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_supplier_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:supplier:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataBoard" @click="$router.push('/jiancha/supplier/stat')">廉洁看板</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 供应商列表 ═══ -->
    <el-table v-loading="loading" :data="supplierList">
      <el-table-column label="供应商ID" align="center" prop="supplierId" width="90" />
      <el-table-column label="供应商编号" align="center" prop="supplierCode" width="150" />
      <el-table-column label="供应商名称" align="left" prop="supplierName" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="供应类别" align="center" prop="category" width="120">
        <template #default="scope">
          <dict-tag :options="jc_supplier_category" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column label="联系人" align="center" prop="contactName" width="100" />
      <el-table-column label="联系电话" align="center" prop="contactPhone" width="130" />
      <el-table-column label="档案状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_supplier_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="准入日期" align="center" prop="admitDate" width="120" />
      <el-table-column label="黑名单到期" align="center" prop="blackUntil" width="120">
        <template #default="scope">
          <span v-if="scope.row.blackUntil">{{ scope.row.blackUntil }}</span>
          <span v-else-if="scope.row.status === '4'" style="color:#f56c6c">永久</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="330" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:supplier:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:supplier:edit']">修改</el-button>
          <el-button link type="success" icon="Select" @click="openAudit(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:supplier:audit']">准入审查</el-button>
          <el-button link type="danger" icon="CircleClose" @click="openBlack(scope.row)" v-if="scope.row.status !== '4'" v-hasPermi="['jiancha:supplier:black']">拉黑</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-if="scope.row.status === '0'" v-hasPermi="['jiancha:supplier:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉（含协议/黑名单/关联沿革） ═══ -->
    <el-drawer v-model="detailOpen" :title="'供应商详情 - ' + (detail.supplierName || '')" size="65%">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="供应商编号">{{ detail.supplierCode }}</el-descriptions-item>
        <el-descriptions-item label="供应类别"><dict-tag :options="jc_supplier_category" :value="detail.category" /></el-descriptions-item>
        <el-descriptions-item label="统一社会信用代码">{{ detail.creditCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="档案状态"><dict-tag :options="jc_supplier_status" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detail.contactName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detail.contactPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="电子邮箱">{{ detail.contactEmail || '—' }}</el-descriptions-item>
        <el-descriptions-item label="准入日期">{{ detail.admitDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="注册地址" :span="2">{{ detail.address || '—' }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">廉洁协议</div>
      <el-table v-if="agreements.length" :data="agreements" size="small" border>
        <el-table-column label="协议编号" prop="agreementNo" width="180" />
        <el-table-column label="签署日期" prop="signDate" width="120" align="center" />
        <el-table-column label="到期日期" prop="expireDate" width="120" align="center" />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope"><dict-tag :options="jc_agreement_status" :value="scope.row.status" /></template>
        </el-table-column>
        <el-table-column label="续签次数" prop="renewCount" width="90" align="center" />
        <el-table-column label="附件" prop="fileName" :show-overflow-tooltip="true" />
      </el-table>
      <el-empty v-else description="暂无廉洁协议" :image-size="60" />

      <div class="section-title">黑名单沿革</div>
      <el-table v-if="blacks.length" :data="blacks" size="small" border>
        <el-table-column label="拉黑日期" prop="blackDate" width="120" align="center" />
        <el-table-column label="拉黑原因" prop="blackReason" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="到期日期" prop="blackUntil" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.blackUntil">{{ scope.row.blackUntil }}</span>
            <span v-else style="color:#f56c6c">永久</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.status === '1' ? 'danger' : 'success'">{{ scope.row.status === '1' ? '生效中' : '已解除' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="解除日期" prop="liftDate" width="120" align="center" />
        <el-table-column label="解除意见" prop="liftOpinion" :show-overflow-tooltip="true" />
      </el-table>
      <el-empty v-else description="暂无黑名单记录" :image-size="60" />

      <div class="section-title">关联排查记录</div>
      <el-table v-if="links.length" :data="links" size="small" border>
        <el-table-column label="关联人员" prop="personName" width="100" align="center" />
        <el-table-column label="关联类型" prop="linkType" width="110" align="center">
          <template #default="scope"><dict-tag :options="jc_supplier_link_type" :value="scope.row.linkType" /></template>
        </el-table-column>
        <el-table-column label="持股比例(%)" prop="holdRatio" width="110" align="center" />
        <el-table-column label="来源" prop="sourceType" width="90" align="center">
          <template #default="scope"><dict-tag :options="jc_supplier_source" :value="scope.row.sourceType" /></template>
        </el-table-column>
        <el-table-column label="核实状态" prop="verifyStatus" width="90" align="center" />
        <el-table-column label="处置结果" prop="handleResult" width="100" align="center">
          <template #default="scope">
            <dict-tag v-if="scope.row.handleResult" :options="jc_link_handle" :value="scope.row.handleResult" />
            <span v-else style="color:#c0c4cc">待处置</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无关联排查记录" :image-size="60" />
    </el-drawer>

    <!-- ═══ 新增/修改对话框 ═══ -->
    <el-dialog :title="dialogTitle" v-model="formOpen" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="supplierName">
              <el-input v-model="form.supplierName" placeholder="请输入供应商全称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="creditCode">
              <el-input v-model="form.creditCode" placeholder="18位信用代码" maxlength="18" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应类别" prop="category">
              <el-select v-model="form.category" placeholder="请选择类别" style="width: 100%">
                <el-option v-for="d in jc_supplier_category" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="form.contactName" placeholder="联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="contactEmail">
              <el-input v-model="form.contactEmail" placeholder="电子邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="注册地址" prop="address">
              <el-input v-model="form.address" type="textarea" :rows="2" placeholder="注册地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="formOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 准入审查对话框 ═══ -->
    <el-dialog title="准入审查" v-model="auditOpen" width="500px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        审查结论将直接变更档案状态：通过=正常、观察=观察期、禁入=禁入（记入档案）。结论与意见全程留痕。
      </el-alert>
      <el-form ref="auditRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="供应商">
          <span>{{ currentSupplier.supplierName }}（{{ currentSupplier.supplierCode }}）</span>
        </el-form-item>
        <el-form-item label="审查结论" prop="auditResult">
          <el-radio-group v-model="auditForm.auditResult">
            <el-radio value="pass">通过（正常）</el-radio>
            <el-radio value="observe">观察期</el-radio>
            <el-radio value="deny">禁入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审查意见" prop="opinion">
          <el-input v-model="auditForm.opinion" type="textarea" :rows="3" placeholder="填写审查依据与意见（将留痕）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAudit">确认审查</el-button>
          <el-button @click="auditOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 拉黑对话框 ═══ -->
    <el-dialog title="拉入黑名单" v-model="blackOpen" width="500px" append-to-body>
      <el-alert type="warning" :closable="false" style="margin-bottom: 12px">
        拉黑后该供应商不得参与公司采购活动；期限届满自动解除，也可人工提前解除（须填意见）。
      </el-alert>
      <el-form ref="blackRef" :model="blackForm" :rules="blackRules" label-width="100px">
        <el-form-item label="供应商">
          <span>{{ currentSupplier.supplierName }}（{{ currentSupplier.supplierCode }}）</span>
        </el-form-item>
        <el-form-item label="拉黑原因" prop="blackReason">
          <el-input v-model="blackForm.blackReason" type="textarea" :rows="3" placeholder="必填：拉黑的事实依据" />
        </el-form-item>
        <el-form-item label="拉黑天数" prop="blackDays">
          <el-input-number v-model="blackForm.blackDays" :min="1" :max="3650" style="width: 180px" />
          <span style="margin-left: 8px; color: #909399">留空=永久拉黑</span>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="blackForm.severity" placeholder="请选择" style="width: 100%">
            <el-option label="一般" value="minor" />
            <el-option label="较重" value="major" />
            <el-option label="严重" value="serious" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="danger" @click="submitBlack">确认拉黑</el-button>
          <el-button @click="blackOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SupplierIndex">
import { listSupplier, getSupplier, addSupplier, updateSupplier, delSupplier, auditSupplier, blackSupplier, agreementBySupplier, blackBySupplier, linkBySupplier } from "@/api/jiancha/supplier"

const { proxy } = getCurrentInstance()
const { jc_supplier_status, jc_supplier_category, jc_agreement_status, jc_supplier_link_type, jc_supplier_source, jc_link_handle } =
  useDict("jc_supplier_status", "jc_supplier_category", "jc_agreement_status", "jc_supplier_link_type", "jc_supplier_source", "jc_link_handle")

const supplierList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})
const agreements = ref([])
const blacks = ref([])
const links = ref([])

const formOpen = ref(false)
const dialogTitle = ref("")
const currentSupplier = ref({})

const auditOpen = ref(false)
const blackOpen = ref(false)

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    supplierName: undefined,
    creditCode: undefined,
    category: undefined,
    status: undefined
  },
  auditForm: { auditResult: "pass", opinion: undefined },
  blackForm: { blackReason: undefined, blackDays: undefined, severity: "major" },
  formRules: {
    supplierName: [{ required: true, message: "供应商名称不能为空", trigger: "blur" }],
    creditCode: [{ pattern: /^[0-9A-Z]{18}$/, message: "须为18位大写字母或数字", trigger: "blur" }],
    category: [{ required: true, message: "供应类别不能为空", trigger: "change" }]
  },
  auditRules: {
    auditResult: [{ required: true, message: "请选择审查结论", trigger: "change" }],
    opinion: [{ required: true, message: "审查意见不能为空", trigger: "blur" }]
  },
  blackRules: {
    blackReason: [{ required: true, message: "拉黑原因不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, auditForm, blackForm, formRules, auditRules, blackRules } = toRefs(data)

function getList() {
  loading.value = true
  listSupplier(queryParams.value).then(response => {
    supplierList.value = response.rows
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

function handleAdd() {
  form.value = { category: undefined }
  dialogTitle.value = "新增供应商"
  formOpen.value = true
}

function handleUpdate(row) {
  form.value = Object.assign({}, row)
  dialogTitle.value = "修改供应商 - " + row.supplierName
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.supplierId != null) {
        updateSupplier(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          formOpen.value = false
          getList()
        })
      } else {
        addSupplier(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功，初始状态为待审查")
          formOpen.value = false
          getList()
        })
      }
    }
  })
}

/** 详情：基本信息 + 协议 + 黑名单沿革 + 关联记录 */
function handleDetail(row) {
  detail.value = {}
  agreements.value = []
  blacks.value = []
  links.value = []
  detailOpen.value = true
  getSupplier(row.supplierId).then(res => { detail.value = res.data || {} })
  agreementBySupplier(row.supplierId).then(res => { agreements.value = res.data || [] })
  blackBySupplier(row.supplierId).then(res => { blacks.value = res.data || [] })
  linkBySupplier(row.supplierId).then(res => { links.value = res.data || [] })
}

function openAudit(row) {
  currentSupplier.value = row
  auditForm.value = { auditResult: "pass", opinion: undefined }
  auditOpen.value = true
}

function submitAudit() {
  proxy.$refs["auditRef"].validate(valid => {
    if (valid) {
      auditSupplier(currentSupplier.value.supplierId, auditForm.value).then(() => {
        proxy.$modal.msgSuccess("审查完成")
        auditOpen.value = false
        getList()
      })
    }
  })
}

function openBlack(row) {
  currentSupplier.value = row
  blackForm.value = { blackReason: undefined, blackDays: undefined, severity: "major" }
  blackOpen.value = true
}

function submitBlack() {
  proxy.$refs["blackRef"].validate(valid => {
    if (valid) {
      blackSupplier(currentSupplier.value.supplierId, blackForm.value).then(() => {
        proxy.$modal.msgSuccess("已拉入黑名单")
        blackOpen.value = false
        getList()
      })
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除供应商「' + row.supplierName + '」？仅待审查状态可删除。').then(function () {
    return delSupplier(row.supplierId)
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
