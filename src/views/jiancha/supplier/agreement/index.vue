<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="供应商" prop="supplierId">
        <el-select v-model="queryParams.supplierId" placeholder="全部" clearable filterable style="width: 220px">
          <el-option v-for="s in supplierOptions" :key="s.supplierId" :label="s.supplierName" :value="s.supplierId" />
        </el-select>
      </el-form-item>
      <el-form-item label="协议编号" prop="agreementNo">
        <el-input v-model="queryParams.agreementNo" placeholder="编号关键字" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="协议状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="d in jc_agreement_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:supplier:agreement:add']">签署协议</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 协议列表 ═══ -->
    <el-table v-loading="loading" :data="agreementList">
      <el-table-column label="协议ID" align="center" prop="agreementId" width="90" />
      <el-table-column label="协议编号" align="center" prop="agreementNo" width="190" />
      <el-table-column label="供应商" align="left" prop="supplierName" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="签署日期" align="center" prop="signDate" width="120" />
      <el-table-column label="到期日期" align="center" prop="expireDate" width="120">
        <template #default="scope">
          <span v-if="scope.row.expireDate && isExpiringSoon(scope.row.expireDate)" style="color:#e6a23c">{{ scope.row.expireDate }}（临期）</span>
          <span v-else>{{ scope.row.expireDate }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_agreement_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="续签次数" align="center" prop="renewCount" width="100" />
      <el-table-column label="最近续签" align="center" prop="lastRenewDate" width="120" />
      <el-table-column label="附件" align="left" prop="fileName" :show-overflow-tooltip="true" min-width="140" />
      <el-table-column label="操作" width="260" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:supplier:agreement:query']">详情</el-button>
          <el-button link type="success" icon="RefreshRight" @click="openRenew(scope.row)" v-if="scope.row.status !== 'lifted'" v-hasPermi="['jiancha:supplier:agreement:renew']">续签</el-button>
          <el-button link type="warning" icon="CircleClose" @click="handleLift(scope.row)" v-if="scope.row.status === 'active'" v-hasPermi="['jiancha:supplier:agreement:lift']">解除</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:supplier:agreement:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'廉洁协议详情 - ' + (detail.agreementNo || '')" size="50%">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="协议编号">{{ detail.agreementNo }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="jc_agreement_status" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detail.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="签署日期">{{ detail.signDate }}</el-descriptions-item>
        <el-descriptions-item label="到期日期">{{ detail.expireDate }}</el-descriptions-item>
        <el-descriptions-item label="续签次数">{{ detail.renewCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="最近续签">{{ detail.lastRenewDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="附件名称" :span="2">{{ detail.fileName || '—' }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.fileUrl" label="附件下载" :span="2">
          <el-link type="primary" :href="detail.fileUrl" target="_blank" icon="Download">下载协议文本</el-link>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <!-- ═══ 签署协议对话框 ═══ -->
    <el-dialog title="签署廉洁协议" v-model="formOpen" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable style="width: 100%">
            <el-option v-for="s in supplierOptions" :key="s.supplierId" :label="s.supplierName + '（' + s.supplierCode + '）'" :value="s.supplierId" />
          </el-select>
        </el-form-item>
        <el-form-item label="协议编号" prop="agreementNo">
          <el-input v-model="form.agreementNo" placeholder="协议编号（不填则自动生成）" style="width: 100%" />
        </el-form-item>
        <el-form-item label="签署日期" prop="signDate">
          <el-date-picker v-model="form.signDate" type="date" value-format="YYYY-MM-DD" placeholder="选择签署日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期日期" prop="expireDate">
          <el-date-picker v-model="form.expireDate" type="date" value-format="YYYY-MM-DD" placeholder="选择到期日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="协议文本" prop="fileName">
          <el-input v-model="form.fileName" placeholder="协议文本文件名（附件地址可在修改时补充）" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="formOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 续签对话框 ═══ -->
    <el-dialog title="协议续签" v-model="renewOpen" width="500px" append-to-body>
      <el-form ref="renewRef" :model="renewForm" :rules="renewRules" label-width="110px">
        <el-form-item label="协议编号">
          <span>{{ currentAgreement.agreementNo }}</span>
        </el-form-item>
        <el-form-item label="原到期日">
          <span>{{ currentAgreement.expireDate }}</span>
        </el-form-item>
        <el-form-item label="新到期日" prop="newExpireDate">
          <el-date-picker v-model="renewForm.newExpireDate" type="date" value-format="YYYY-MM-DD" placeholder="选择新的到期日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="续签意见" prop="opinion">
          <el-input v-model="renewForm.opinion" type="textarea" :rows="3" placeholder="续签说明（将留痕）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRenew">确认续签</el-button>
          <el-button @click="renewOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SupplierAgreement">
import { listSupplier } from "@/api/jiancha/supplier"
import { listAgreement, getAgreement, addAgreement, renewAgreement, liftAgreement, delAgreement } from "@/api/jiancha/supplier"

const { proxy } = getCurrentInstance()
const { jc_agreement_status } = useDict("jc_agreement_status")

const agreementList = ref([])
const supplierOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const formOpen = ref(false)
const renewOpen = ref(false)
const currentAgreement = ref({})

const data = reactive({
  form: {},
  renewForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    supplierId: undefined,
    agreementNo: undefined,
    status: undefined
  },
  formRules: {
    supplierId: [{ required: true, message: "请选择供应商", trigger: "change" }],
    signDate: [{ required: true, message: "签署日期不能为空", trigger: "change" }],
    expireDate: [{ required: true, message: "到期日期不能为空", trigger: "change" }]
  },
  renewRules: {
    newExpireDate: [{ required: true, message: "新到期日不能为空", trigger: "change" }],
    opinion: [{ required: true, message: "续签意见不能为空", trigger: "blur" }]
  }
})

const { queryParams, form, renewForm, formRules, renewRules } = toRefs(data)

/** 到期前 30 天内视为临期（与后端刷新任务的预警窗口一致） */
function isExpiringSoon(expireDate) {
  if (!expireDate) return false
  const diff = (new Date(expireDate).getTime() - Date.now()) / 86400000
  return diff >= 0 && diff <= 30
}

function getList() {
  loading.value = true
  listAgreement(queryParams.value).then(response => {
    agreementList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getSupplierOptions() {
  listSupplier({ pageNum: 1, pageSize: 500 }).then(res => {
    supplierOptions.value = res.rows || []
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
  getAgreement(row.agreementId).then(res => { detail.value = res.data || {} })
}

function handleAdd() {
  form.value = { signDate: new Date().toISOString().slice(0, 10) }
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      addAgreement(form.value).then(() => {
        proxy.$modal.msgSuccess("协议签署成功")
        formOpen.value = false
        getList()
      })
    }
  })
}

function openRenew(row) {
  currentAgreement.value = row
  renewForm.value = { newExpireDate: undefined, opinion: undefined }
  renewOpen.value = true
}

function submitRenew() {
  proxy.$refs["renewRef"].validate(valid => {
    if (valid) {
      renewAgreement(currentAgreement.value.agreementId, renewForm.value).then(() => {
        proxy.$modal.msgSuccess("续签成功")
        renewOpen.value = false
        getList()
      })
    }
  })
}

function handleLift(row) {
  proxy.$modal.confirm('是否确认解除协议「' + row.agreementNo + '」？').then(function () {
    return liftAgreement(row.agreementId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("已解除")
  }).catch(() => {})
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除协议「' + row.agreementNo + '」？').then(function () {
    return delAgreement(row.agreementId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
getSupplierOptions()
</script>
