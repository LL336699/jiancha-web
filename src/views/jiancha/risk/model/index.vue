<template>
  <div class="app-container">
    <!-- ═══ 岗位权重汇总（三级视图-岗位层） ═══ -->
    <el-row :gutter="12" class="mb8" v-if="positionSummary.length">
      <el-col :span="8" v-for="p in positionSummary" :key="p.name">
        <div class="stat-card" :class="{ 'stat-danger': p.value > 60, 'stat-warning': p.value > 40 && p.value <= 60 }">
          <div class="stat-num">{{ p.value }}<span style="font-size:13px;color:#909399"> 分</span></div>
          <div class="stat-label">{{ p.name }}（权重合计，超过 60 分触发岗位高风险预警）</div>
        </div>
      </el-col>
    </el-row>

    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="岗位名称" prop="positionName">
        <el-input v-model="queryParams.positionName" placeholder="岗位关键字" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="因子编号" prop="factorCode">
        <el-input v-model="queryParams.factorCode" placeholder="如 F01" clearable style="width: 130px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- ═══ 工具栏 ═══ -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:risk:model:add']">新增模型行</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 模型行列表 ═══ -->
    <el-table v-loading="loading" :data="modelList">
      <el-table-column label="岗位" align="center" prop="positionName" width="140" />
      <el-table-column label="因子编号" align="center" prop="factorCode" width="100" />
      <el-table-column label="风险因子" align="center" prop="factorName" width="140" />
      <el-table-column label="权重" align="center" prop="weight" width="90">
        <template #default="scope">
          <span :style="{ color: scope.row.weight >= 30 ? '#f56c6c' : '#303133', fontWeight: scope.row.weight >= 30 ? '600' : '400' }">
            {{ scope.row.weight }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="因子说明" align="left" prop="description" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ scope.row.status === '0' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:risk:model:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:risk:model:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 新增 / 修改模型行 ═══ -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="岗位名称" prop="positionName">
          <el-input v-model="form.positionName" placeholder="如采购经理、招投标专员" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="因子编号" prop="factorCode">
              <el-input v-model="form.factorCode" placeholder="如 F01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险因子" prop="factorName">
              <el-input v-model="form.factorName" placeholder="如供应商接触度" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="权重" prop="weight">
          <el-input-number v-model="form.weight" :min="0" :max="100" :precision="1" :controls="false" style="width: 220px" placeholder="0-100" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">同岗位各行权重合计超过 60 分即触发 R06 岗位高风险</span>
        </el-form-item>
        <el-form-item label="因子说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="因子语义、评定口径" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">启用</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RiskModel">
import { listRiskModel, addRiskModel, updateRiskModel, delRiskModel, positionWeight } from "@/api/jiancha/risk"

const { proxy } = getCurrentInstance()

const modelList = ref([])
const positionSummary = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")
const open = ref(false)

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    positionName: undefined,
    factorCode: undefined
  },
  rules: {
    positionName: [{ required: true, message: "请填写岗位名称", trigger: "blur" }],
    factorCode: [{ required: true, message: "请填写因子编号", trigger: "blur" }],
    factorName: [{ required: true, message: "请填写风险因子名称", trigger: "blur" }],
    weight: [{ required: true, message: "请填写权重", trigger: "blur" }],
    description: [{ required: true, message: "请填写因子说明", trigger: "blur" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listRiskModel(queryParams.value).then(response => {
    modelList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getPositionSummary() {
  positionWeight().then(res => {
    positionSummary.value = (res.data || []).map(x => ({ name: x.name, value: Number(x.value) }))
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

function reset() {
  form.value = {
    modelId: undefined,
    positionName: undefined,
    factorCode: undefined,
    factorName: undefined,
    weight: undefined,
    description: undefined,
    status: "0",
    remark: undefined
  }
  proxy.resetForm("modelRef")
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "新增岗位风险模型行"
}

function handleUpdate(row) {
  reset()
  form.value = { ...row }
  open.value = true
  title.value = "修改岗位风险模型行"
}

function submitForm() {
  proxy.$refs["modelRef"].validate(valid => {
    if (valid) {
      if (form.value.modelId != undefined) {
        updateRiskModel(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
          getPositionSummary()
        })
      } else {
        addRiskModel(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
          getPositionSummary()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除模型行「' + row.positionName + ' - ' + row.factorName + '」？').then(function () {
    return delRiskModel(row.modelId)
  }).then(() => {
    getList()
    getPositionSummary()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
getPositionSummary()
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
</style>
