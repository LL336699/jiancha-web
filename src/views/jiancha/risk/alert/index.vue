<template>
  <div class="app-container">
    <!-- ═══ 统计概览 ═══ -->
    <el-row :gutter="12" class="mb8">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-num">{{ stat.total || 0 }}</div>
          <div class="stat-label">预警总量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ stat.pending || 0 }}</div>
          <div class="stat-label">待核实</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ stat.highOpen || 0 }}</div>
          <div class="stat-label">高级别未闭环</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ stat.confirmRate != null ? stat.confirmRate + '%' : '—' }}</div>
          <div class="stat-label">转整改率</div>
        </div>
      </el-col>
    </el-row>

    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="预警编号" prop="alertNo">
        <el-input v-model="queryParams.alertNo" placeholder="RA 编号" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="规则" prop="ruleCode">
        <el-select v-model="queryParams.ruleCode" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="r in ruleOptions" :key="r.ruleCode" :label="r.ruleCode + ' ' + r.ruleName" :value="r.ruleCode" />
        </el-select>
      </el-form-item>
      <el-form-item label="对象" prop="objectName">
        <el-input v-model="queryParams.objectName" placeholder="对象名称关键字" clearable style="width: 150px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="等级" prop="alertLevel">
        <el-select v-model="queryParams.alertLevel" placeholder="全部" clearable style="width: 100px">
          <el-option v-for="d in jc_risk_alert_level" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="d in jc_risk_alert_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:risk:add']">手动登记</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Refresh" :loading="scanLoading" @click="handleScan" v-hasPermi="['jiancha:risk:scan']">触发扫描</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="DataLine" @click="$router.push('/jiancha/risk/stat')">风险看板</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <!-- ═══ 预警列表 ═══ -->
    <el-table v-loading="loading" :data="alertList">
      <el-table-column label="预警编号" align="center" prop="alertNo" width="150" />
      <el-table-column label="规则" align="center" prop="ruleName" width="120">
        <template #default="scope">
          <span>{{ scope.row.ruleCode }} {{ scope.row.ruleName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="对象类型" align="center" prop="objectType" width="90">
        <template #default="scope">
          <dict-tag :options="jc_risk_object_type" :value="scope.row.objectType" />
        </template>
      </el-table-column>
      <el-table-column label="对象" align="center" prop="objectName" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="等级" align="center" prop="alertLevel" width="80">
        <template #default="scope">
          <dict-tag :options="jc_risk_alert_level" :value="scope.row.alertLevel" />
        </template>
      </el-table-column>
      <el-table-column label="评分" align="center" prop="score" width="70" />
      <el-table-column label="证据" align="left" prop="evidence" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="状态" align="center" prop="status" width="110">
        <template #default="scope">
          <dict-tag :options="jc_risk_alert_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="关联整改" align="center" width="140">
        <template #default="scope">
          <span v-if="scope.row.issueNo">{{ scope.row.issueNo }}</span>
          <span v-else style="color:#c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column label="生成时间" align="center" prop="createTime" width="150" />
      <el-table-column label="操作" width="230" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['jiancha:risk:query']">详情</el-button>
          <el-button link type="primary" icon="CircleCheck" @click="openVerify(scope.row)" v-hasPermi="['jiancha:risk:verify']">核实</el-button>
          <el-button link type="primary" icon="Files" @click="goRectify(scope.row)" v-if="scope.row.issueNo">整改台账</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 预警详情抽屉 ═══ -->
    <el-drawer v-model="detailOpen" :title="'预警详情 - ' + (detailAlert.alertNo || '')" size="58%">
      <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
        <el-descriptions-item label="命中规则">{{ detailAlert.ruleCode }} {{ detailAlert.ruleName }}</el-descriptions-item>
        <el-descriptions-item label="等级"><dict-tag :options="jc_risk_alert_level" :value="detailAlert.alertLevel" /></el-descriptions-item>
        <el-descriptions-item label="对象类型"><dict-tag :options="jc_risk_object_type" :value="detailAlert.objectType" /></el-descriptions-item>
        <el-descriptions-item label="对象">{{ detailAlert.objectName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="评分">{{ detailAlert.score }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="jc_risk_alert_status" :value="detailAlert.status" /></el-descriptions-item>
        <el-descriptions-item label="生成时间" :span="2">{{ detailAlert.createTime }}</el-descriptions-item>
        <el-descriptions-item label="证据链" :span="2">
          <div style="white-space: pre-wrap;">{{ detailAlert.evidence }}</div>
        </el-descriptions-item>
        <template v-if="detailAlert.verifyBy">
          <el-descriptions-item label="核实结论"><dict-tag :options="jc_risk_alert_status" :value="detailAlert.status" /></el-descriptions-item>
          <el-descriptions-item label="核实人">{{ detailAlert.verifyBy }}</el-descriptions-item>
          <el-descriptions-item label="核实时间" :span="2">{{ detailAlert.verifyTime }}</el-descriptions-item>
          <el-descriptions-item label="核实意见" :span="2">
            <div style="white-space: pre-wrap;">{{ detailAlert.verifyOpinion }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="detailAlert.issueNo" label="关联整改问题" :span="2">
            <el-button link type="primary" @click="goRectify(detailAlert)">{{ detailAlert.issueNo }}</el-button>
          </el-descriptions-item>
        </template>
      </el-descriptions>
      <div style="margin-top: 16px">
        <el-button type="primary" icon="CircleCheck" @click="openVerify(detailAlert)" v-hasPermi="['jiancha:risk:verify']">核实预警</el-button>
      </div>
    </el-drawer>

    <!-- ═══ 手动登记预警 ═══ -->
    <el-dialog title="手动登记预警" v-model="open" width="640px" append-to-body>
      <el-form ref="alertRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="规则编号" prop="ruleCode">
          <el-select v-model="form.ruleCode" placeholder="选择规则（自动带出名称）" clearable style="width: 100%" @change="onRuleChange">
            <el-option v-for="r in ruleOptions" :key="r.ruleCode" :label="r.ruleCode + ' ' + r.ruleName" :value="r.ruleCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="规则名称" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="对象类型" prop="objectType">
              <el-select v-model="form.objectType" placeholder="请选择对象类型" style="width: 100%">
                <el-option v-for="d in jc_risk_object_type" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对象名称" prop="objectName">
              <el-input v-model="form.objectName" placeholder="如张三 / 采购部 / 采购经理" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="预警等级" prop="alertLevel">
              <el-select v-model="form.alertLevel" placeholder="请选择等级" style="width: 100%">
                <el-option v-for="d in jc_risk_alert_level" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评分" prop="score">
              <el-input-number v-model="form.score" :min="0" :max="100" :controls="false" style="width: 100%" placeholder="0-100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="证据描述" prop="evidence">
          <el-input v-model="form.evidence" type="textarea" :rows="3" placeholder="命中依据、数据来源" />
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

    <!-- ═══ 核实对话框 ═══ -->
    <el-dialog title="预警核实" v-model="verifyOpen" width="600px" append-to-body>
      <el-form ref="verifyRef" :model="verifyForm" :rules="verifyRules" label-width="110px">
        <el-form-item label="当前状态">
          <dict-tag :options="jc_risk_alert_status" :value="currentAlert.status" />
        </el-form-item>
        <el-form-item label="核实结论" prop="action">
          <el-radio-group v-model="verifyForm.action">
            <el-radio value="confirm">确认（转整改）</el-radio>
            <el-radio value="exclude">排除（误报）</el-radio>
            <el-radio value="archive">归档</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="verifyForm.action === 'confirm'">
          <el-form-item label="责任部门" prop="targetDeptId">
            <el-tree-select v-model="verifyForm.targetDeptId" :data="deptOptions" :props="{ value: 'id', label: 'label', children: 'children' }" value-key="id" placeholder="确认转整顿时必填" clearable check-strictly style="width: 100%" />
          </el-form-item>
          <el-form-item label="严重程度" prop="severity">
            <el-select v-model="verifyForm.severity" placeholder="请选择严重程度" style="width: 100%">
              <el-option v-for="d in jc_rectify_severity" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item label="核实意见" prop="opinion">
          <el-input v-model="verifyForm.opinion" type="textarea" :rows="3" placeholder="核实过程、依据、结论说明（全程留痕）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitVerify">确认核实</el-button>
          <el-button @click="verifyOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RiskAlert">
import { listRiskAlert, getRiskAlert, addRiskAlert, verifyRiskAlert, scanRiskAlert, listRiskRule, riskStat } from "@/api/jiancha/risk"
import { deptTreeSelect } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { jc_risk_alert_level, jc_risk_alert_status, jc_risk_object_type, jc_rectify_severity } =
  useDict("jc_risk_alert_level", "jc_risk_alert_status", "jc_risk_object_type", "jc_rectify_severity")

const alertList = ref([])
const ruleOptions = ref([])
const deptOptions = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const stat = ref({})
const scanLoading = ref(false)

const open = ref(false)
const detailOpen = ref(false)
const detailAlert = ref({})
const verifyOpen = ref(false)
const currentAlert = ref({})

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    alertNo: undefined,
    ruleCode: undefined,
    objectName: undefined,
    alertLevel: undefined,
    status: undefined
  },
  rules: {
    ruleName: [{ required: true, message: "请填写规则名称", trigger: "blur" }],
    objectType: [{ required: true, message: "请选择对象类型", trigger: "change" }],
    objectName: [{ required: true, message: "请填写对象名称", trigger: "blur" }],
    alertLevel: [{ required: true, message: "请选择预警等级", trigger: "change" }],
    evidence: [{ required: true, message: "请填写证据描述", trigger: "blur" }]
  },
  verifyForm: {},
  verifyRules: {
    action: [{ required: true, message: "请选择核实结论", trigger: "change" }],
    targetDeptId: [{ required: true, message: "确认转整改必须指定责任部门", trigger: "change" }],
    severity: [{ required: true, message: "请选择严重程度", trigger: "change" }],
    opinion: [{ required: true, message: "请填写核实意见", trigger: "blur" }]
  }
})

const { queryParams, form, rules, verifyForm, verifyRules } = toRefs(data)

function getList() {
  loading.value = true
  listRiskAlert(queryParams.value).then(response => {
    alertList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function getRules() {
  listRiskRule({ pageNum: 1, pageSize: 100 }).then(res => { ruleOptions.value = res.rows || [] })
}

function getDepts() {
  deptTreeSelect().then(res => { deptOptions.value = res.data })
}

function getStat() {
  riskStat().then(res => { stat.value = res.data || {} })
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
  form.value = {
    ruleCode: undefined,
    ruleName: undefined,
    objectType: undefined,
    objectName: undefined,
    alertLevel: undefined,
    score: undefined,
    evidence: undefined,
    remark: undefined
  }
  proxy.resetForm("alertRef")
  open.value = true
}

/** 选择规则后自动带出规则名称 */
function onRuleChange(ruleCode) {
  const r = ruleOptions.value.find(x => x.ruleCode === ruleCode)
  form.value.ruleName = r ? r.ruleName : undefined
}

function submitForm() {
  proxy.$refs["alertRef"].validate(valid => {
    if (valid) {
      addRiskAlert(form.value).then(() => {
        proxy.$modal.msgSuccess("登记成功")
        open.value = false
        getList()
      })
    }
  })
}

function handleDetail(row) {
  detailAlert.value = {}
  detailOpen.value = true
  getRiskAlert(row.alertId).then(res => { detailAlert.value = res.data || {} })
}

function openVerify(row) {
  currentAlert.value = row
  verifyForm.value = { action: undefined, opinion: undefined, targetDeptId: undefined, severity: undefined }
  proxy.resetForm("verifyRef")
  verifyOpen.value = true
}

function submitVerify() {
  proxy.$refs["verifyRef"].validate(valid => {
    if (valid) {
      verifyRiskAlert(currentAlert.value.alertId, verifyForm.value).then(() => {
        proxy.$modal.msgSuccess("核实完成")
        verifyOpen.value = false
        getList()
        if (detailOpen.value) {
          handleDetail(currentAlert.value)
        }
      })
    }
  })
}

function handleScan() {
  scanLoading.value = true
  scanRiskAlert().then(res => {
    scanLoading.value = false
    proxy.$modal.msgSuccess(res.msg || "扫描完成")
    getList()
  }).catch(() => { scanLoading.value = false })
}

/** 跳转整改台账（按关联问题编号检索） */
function goRectify(row) {
  proxy.$router.push({ path: '/jiancha/rectify/issue', query: { issueNo: row.issueNo } })
}

getList()
getRules()
getDepts()
getStat()
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
</style>
