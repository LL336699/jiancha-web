<template>
  <div class="app-container">
    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="规则编号" prop="ruleCode">
        <el-input v-model="queryParams.ruleCode" placeholder="如 R01" clearable style="width: 140px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="规则名称" prop="ruleName">
        <el-input v-model="queryParams.ruleName" placeholder="名称关键字" clearable style="width: 170px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="规则类型" prop="ruleType">
        <el-select v-model="queryParams.ruleType" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_risk_rule_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
          <el-option label="启用" value="0" />
          <el-option label="停用" value="1" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:risk:rule:add']">新增规则</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 规则列表 ═══ -->
    <el-table v-loading="loading" :data="ruleList">
      <el-table-column label="规则编号" align="center" prop="ruleCode" width="100" />
      <el-table-column label="规则名称" align="center" prop="ruleName" width="130" />
      <el-table-column label="规则类型" align="center" prop="ruleType" width="110">
        <template #default="scope">
          <dict-tag :options="jc_risk_rule_type" :value="scope.row.ruleType" />
        </template>
      </el-table-column>
      <el-table-column label="触发阈值" align="center" width="140">
        <template #default="scope">
          <span>{{ scope.row.threshold }} {{ scope.row.thresholdUnit }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预警等级" align="center" prop="alertLevel" width="90">
        <template #default="scope">
          <dict-tag :options="jc_risk_alert_level" :value="scope.row.alertLevel" />
        </template>
      </el-table-column>
      <el-table-column label="规则说明" align="left" prop="description" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-tag size="small" :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ scope.row.status === '0' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:risk:rule:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:risk:rule:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 新增 / 修改规则 ═══ -->
    <el-dialog :title="title" v-model="open" width="640px" append-to-body>
      <el-form ref="ruleRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="规则编号" prop="ruleCode">
              <el-input v-model="form.ruleCode" placeholder="如 R07（不可重复）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input v-model="form.ruleName" placeholder="规则名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="规则类型" prop="ruleType">
              <el-select v-model="form.ruleType" placeholder="请选择类型" style="width: 100%">
                <el-option v-for="d in jc_risk_rule_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警等级" prop="alertLevel">
              <el-select v-model="form.alertLevel" placeholder="请选择等级" style="width: 100%">
                <el-option v-for="d in jc_risk_alert_level" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="触发阈值" prop="threshold">
              <el-input-number v-model="form.threshold" :min="0" :precision="2" :controls="false" style="width: 100%" placeholder="达到即触发" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="阈值单位" prop="thresholdUnit">
              <el-input v-model="form.thresholdUnit" placeholder="次 / 条 / 笔" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规则说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="规则语义、统计口径、数据来源" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">启用</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script setup name="RiskRule">
import { listRiskRule, getRiskRule, addRiskRule, updateRiskRule, delRiskRule } from "@/api/jiancha/risk"

const { proxy } = getCurrentInstance()
const { jc_risk_rule_type, jc_risk_alert_level } = useDict("jc_risk_rule_type", "jc_risk_alert_level")

const ruleList = ref([])
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
    ruleCode: undefined,
    ruleName: undefined,
    ruleType: undefined,
    status: undefined
  },
  rules: {
    ruleCode: [{ required: true, message: "请填写规则编号", trigger: "blur" }],
    ruleName: [{ required: true, message: "请填写规则名称", trigger: "blur" }],
    ruleType: [{ required: true, message: "请选择规则类型", trigger: "change" }],
    threshold: [{ required: true, message: "请填写触发阈值", trigger: "blur" }],
    alertLevel: [{ required: true, message: "请选择预警等级", trigger: "change" }],
    description: [{ required: true, message: "请填写规则说明", trigger: "blur" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listRiskRule(queryParams.value).then(response => {
    ruleList.value = response.rows
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

function reset() {
  form.value = {
    ruleId: undefined,
    ruleCode: undefined,
    ruleName: undefined,
    ruleType: undefined,
    threshold: undefined,
    thresholdUnit: undefined,
    alertLevel: undefined,
    description: undefined,
    status: "0",
    remark: undefined
  }
  proxy.resetForm("ruleRef")
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "新增风险规则"
}

function handleUpdate(row) {
  reset()
  getRiskRule(row.ruleId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改风险规则"
  })
}

function submitForm() {
  proxy.$refs["ruleRef"].validate(valid => {
    if (valid) {
      if (form.value.ruleId != undefined) {
        updateRiskRule(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addRiskRule(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除规则「' + row.ruleCode + ' ' + row.ruleName + '」？删除后引擎不再命中该规则。').then(function () {
    return delRiskRule(row.ruleId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>
