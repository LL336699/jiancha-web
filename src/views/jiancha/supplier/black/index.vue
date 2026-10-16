<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="供应商" prop="supplierName">
        <el-input v-model="queryParams.supplierName" placeholder="供应商名称关键字" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="生效中" value="1" />
          <el-option label="已解除" value="2" />
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
        <el-button type="warning" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataBoard" @click="$router.push('/jiancha/supplier/stat')">廉洁看板</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 黑名单列表 ═══ -->
    <el-table v-loading="loading" :data="blackList">
      <el-table-column label="记录ID" align="center" prop="blackId" width="90" />
      <el-table-column label="供应商" align="left" prop="supplierName" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="拉黑日期" align="center" prop="blackDate" width="120" />
      <el-table-column label="拉黑原因" align="left" prop="blackReason" :show-overflow-tooltip="true" min-width="240" />
      <el-table-column label="到期日期" align="center" prop="blackUntil" width="130">
        <template #default="scope">
          <span v-if="scope.row.blackUntil">{{ scope.row.blackUntil }}</span>
          <span v-else style="color:#f56c6c">永久</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.status === '1' ? 'danger' : 'success'">
            {{ scope.row.status === '1' ? '生效中' : '已解除' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="解除日期" align="center" prop="liftDate" width="120">
        <template #default="scope">
          <span v-if="scope.row.liftDate">{{ scope.row.liftDate }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="解除人" align="center" prop="liftBy" width="100">
        <template #default="scope">
          <span v-if="scope.row.liftBy">{{ scope.row.liftBy }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:supplier:black:query']">详情</el-button>
          <el-button link type="success" icon="Unlock" @click="openLift(scope.row)" v-if="scope.row.status === '1'" v-hasPermi="['jiancha:supplier:black:lift']">解除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'黑名单详情 - ID ' + (detail.blackId || '')" size="50%">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="供应商">{{ detail.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="拉黑日期">{{ detail.blackDate }}</el-descriptions-item>
        <el-descriptions-item label="到期日期">
          <span v-if="detail.blackUntil">{{ detail.blackUntil }}</span>
          <span v-else style="color:#f56c6c">永久</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="detail.status === '1' ? 'danger' : 'success'">
            {{ detail.status === '1' ? '生效中' : '已解除' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="拉黑原因" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.blackReason }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="解除日期">{{ detail.liftDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="解除人">{{ detail.liftBy || '—' }}</el-descriptions-item>
        <el-descriptions-item label="解除意见" :span="2">
          <div style="white-space: pre-wrap;">{{ detail.liftOpinion || '—' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <!-- ═══ 解除黑名单对话框 ═══ -->
    <el-dialog title="解除黑名单" v-model="liftOpen" width="500px" append-to-body>
      <el-alert type="warning" :closable="false" style="margin-bottom: 12px">
        解除后供应商档案恢复为正常状态，可重新参与采购活动。解除原因与意见全程留痕。
      </el-alert>
      <el-form ref="liftRef" :model="liftForm" :rules="liftRules" label-width="100px">
        <el-form-item label="供应商">
          <span>{{ currentBlack.supplierName }}</span>
        </el-form-item>
        <el-form-item label="解除意见" prop="opinion">
          <el-input v-model="liftForm.opinion" type="textarea" :rows="3" placeholder="必填：解除的事实依据与审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitLift">确认解除</el-button>
          <el-button @click="liftOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SupplierBlack">
import { listBlack, getBlack, liftBlack } from "@/api/jiancha/supplier"

const { proxy } = getCurrentInstance()

const blackList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detail = ref({})

const liftOpen = ref(false)
const currentBlack = ref({})

const data = reactive({
  liftForm: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    supplierName: undefined,
    status: undefined
  },
  liftRules: {
    opinion: [{ required: true, message: "解除意见不能为空", trigger: "blur" }]
  }
})

const { queryParams, liftForm, liftRules } = toRefs(data)

function getList() {
  loading.value = true
  listBlack(queryParams.value).then(response => {
    blackList.value = response.rows
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
  getBlack(row.blackId).then(res => { detail.value = res.data || {} })
}

function openLift(row) {
  currentBlack.value = row
  liftForm.value = { opinion: undefined }
  liftOpen.value = true
}

function submitLift() {
  proxy.$refs["liftRef"].validate(valid => {
    if (valid) {
      liftBlack(currentBlack.value.blackId, liftForm.value).then(() => {
        proxy.$modal.msgSuccess("已解除黑名单")
        liftOpen.value = false
        getList()
      })
    }
  })
}

getList()
</script>
