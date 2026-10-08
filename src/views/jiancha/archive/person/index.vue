<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="职务" prop="position">
        <el-input v-model="queryParams.position" placeholder="请输入职务" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="queryParams.riskLevel" placeholder="风险等级" clearable style="width: 160px">
          <el-option v-for="dict in jc_risk_level" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:archive:add']">新增人员</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="personList">
      <el-table-column label="编号" align="center" prop="personCode" width="110" />
      <el-table-column label="姓名" align="center" prop="name" width="110" />
      <el-table-column label="性别" align="center" prop="gender" width="70">
        <template #default="scope">
          <dict-tag :options="jc_gender" :value="scope.row.gender" />
        </template>
      </el-table-column>
      <el-table-column label="职务" align="center" prop="position" :show-overflow-tooltip="true" />
      <el-table-column label="在职状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_person_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="风险等级" align="center" prop="riskLevel" width="100">
        <template #default="scope">
          <dict-tag :options="jc_risk_level" :value="scope.row.riskLevel" />
        </template>
      </el-table-column>
      <el-table-column label="廉洁评分" align="center" prop="integrityScore" width="90" />
      <el-table-column label="操作" width="240" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">档案</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:archive:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:archive:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改人员 -->
    <el-dialog :title="title" v-model="open" width="620px" append-to-body>
      <el-form ref="personRef" :model="form" :rules="rules" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人员编号" prop="personCode">
              <el-input v-model="form.personCode" placeholder="留空自动不填（可自定义）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" placeholder="请选择" style="width: 100%">
                <el-option v-for="dict in jc_gender" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birthDate">
              <el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" placeholder="选择出生日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="职务" prop="position">
              <el-input v-model="form.position" placeholder="请输入职务" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期" prop="entryDate">
              <el-date-picker v-model="form.entryDate" type="date" value-format="YYYY-MM-DD" placeholder="选择入职日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="在职状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                <el-option v-for="dict in jc_person_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCardEnc">
              <el-input v-model="form.idCardEnc" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>
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

    <!-- 档案详情抽屉 -->
    <el-drawer v-model="detailOpen" :title="'档案详情 - ' + (detailPerson.name || '')" size="62%">
      <el-descriptions :column="3" border size="small" style="margin-bottom: 14px">
        <el-descriptions-item label="编号">{{ detailPerson.personCode }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailPerson.name }}</el-descriptions-item>
        <el-descriptions-item label="职务">{{ detailPerson.position }}</el-descriptions-item>
        <el-descriptions-item label="在职状态"><dict-tag :options="jc_person_status" :value="detailPerson.status" /></el-descriptions-item>
        <el-descriptions-item label="风险等级"><dict-tag :options="jc_risk_level" :value="detailPerson.riskLevel" /></el-descriptions-item>
        <el-descriptions-item label="廉洁评分">{{ detailPerson.integrityScore }}</el-descriptions-item>
      </el-descriptions>

      <el-button type="warning" plain icon="Warning" :loading="riskLoading" @click="handleEvaluate" v-hasPermi="['jiancha:archive:edit']">风险评估</el-button>

      <el-alert v-if="riskResult" type="warning" :closable="false" style="margin: 10px 0">
        <div><b>风险等级：</b>{{ riskResult.riskLevel }}　<b>廉洁评分：</b>{{ riskResult.integrityScore }}</div>
        <div v-if="riskResult.hits && riskResult.hits.length">
          <div v-for="(h, i) in riskResult.hits" :key="i">
            ⚠【{{ h.categoryName }}·{{ h.level }}】{{ h.description }}
            <span v-if="h.evidence">（依据：{{ h.evidence }}）</span>
            <span v-if="h.suggestion" style="color:#909399">建议：{{ h.suggestion }}</span>
          </div>
        </div>
        <div v-else>未命中风险规则</div>
        <div style="margin-top:6px;color:#909399">评估结果仅为辅助参考，最终认定须人工核实并留痕。</div>
      </el-alert>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="画像标签" name="tag">
          <el-table :data="detailTags" size="small" border>
            <el-table-column label="标签" align="center" prop="tagName" />
            <el-table-column label="级别" align="center" prop="tagLevel" width="80" />
            <el-table-column label="来源" align="center" prop="tagSource" width="90" />
            <el-table-column label="来源表" align="center" prop="sourceTable" width="150" />
            <el-table-column label="来源ID" align="center" prop="sourceId" width="90" />
            <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="关联关系" name="relation">
          <el-table :data="detailRelations" size="small" border>
            <el-table-column label="姓名" align="center" prop="relationName" width="100" />
            <el-table-column label="关系" align="center" prop="relationType" width="90" />
            <el-table-column label="关联企业" align="center" prop="entName" :show-overflow-tooltip="true" />
            <el-table-column label="关联性质" align="center" prop="relationKind" width="100" />
            <el-table-column label="持股比例" align="center" prop="holdRatio" width="90" />
            <el-table-column label="是否供应商" align="center" prop="isSupplier" width="100">
              <template #default="scope">{{ scope.row.isSupplier === '1' ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="核实状态" align="center" prop="verifyStatus" width="90" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="任职经历" name="career">
          <el-table :data="detailCareers" size="small" border>
            <el-table-column label="单位/岗位" align="center" prop="position" :show-overflow-tooltip="true" />
            <el-table-column label="部门" align="center" prop="deptName" />
            <el-table-column label="职责说明" align="center" prop="dutyDesc" :show-overflow-tooltip="true" />
            <el-table-column label="开始" align="center" prop="startDate" width="110" />
            <el-table-column label="结束" align="center" prop="endDate" width="110" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="处分记录" name="punish">
          <el-table :data="detailPunishes" size="small" border>
            <el-table-column label="处分类型" align="center" prop="punishType" width="110" />
            <el-table-column label="处分日期" align="center" prop="punishDate" width="110" />
            <el-table-column label="生效日期" align="center" prop="effectiveDate" width="110" />
            <el-table-column label="关联案件号" align="center" prop="relatedCaseNo" width="140" />
            <el-table-column label="原因" align="center" prop="punishReason" :show-overflow-tooltip="true" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="利益冲突申报" name="declare">
          <el-table :data="detailDeclares" size="small" border>
            <el-table-column label="申报类型" align="center" prop="declareType" width="110" />
            <el-table-column label="年度" align="center" prop="declareYear" width="80" />
            <el-table-column label="申报日期" align="center" prop="declareDate" width="110" />
            <el-table-column label="状态" align="center" prop="status" width="90" />
            <el-table-column label="核实结论" align="center" prop="verifyResult" :show-overflow-tooltip="true" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup name="Person">
import { listPerson, getPerson, addPerson, updatePerson, delPerson, listTagByPerson, listCareerByPerson, listRelationByPerson, listPunishByPerson, listDeclareByPerson, evaluateRisk, applyRisk } from "@/api/jiancha/person"

const { proxy } = getCurrentInstance()
const { jc_gender, jc_person_status, jc_risk_level } = useDict("jc_gender", "jc_person_status", "jc_risk_level")

const personList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")

const detailOpen = ref(false)
const detailPerson = ref({})
const detailTags = ref([])
const detailRelations = ref([])
const detailCareers = ref([])
const detailPunishes = ref([])
const detailDeclares = ref([])
const activeTab = ref("tag")
const riskLoading = ref(false)
const riskResult = ref(null)

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    position: undefined,
    riskLevel: undefined
  },
  rules: {
    name: [{ required: true, message: "姓名不能为空", trigger: "blur" }],
    status: [{ required: true, message: "在职状态不能为空", trigger: "change" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listPerson(queryParams.value).then(response => {
    personList.value = response.rows
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
    personId: undefined,
    personCode: undefined,
    name: undefined,
    gender: "0",
    birthDate: undefined,
    position: undefined,
    entryDate: undefined,
    status: "在岗",
    idCardEnc: undefined,
    remark: undefined
  }
  proxy.resetForm("personRef")
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
  title.value = "新增人员档案"
}

function handleUpdate(row) {
  reset()
  getPerson(row.personId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改人员档案"
  })
}

function submitForm() {
  proxy.$refs["personRef"].validate(valid => {
    if (valid) {
      if (form.value.personId != undefined) {
        updatePerson(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addPerson(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除人员「' + row.name + '」的档案？').then(function() {
    return delPerson(row.personId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 档案详情：拉取全部子表 */
function handleDetail(row) {
  detailPerson.value = row
  detailTags.value = []
  detailRelations.value = []
  detailCareers.value = []
  detailPunishes.value = []
  detailDeclares.value = []
  riskResult.value = null
  detailOpen.value = true
  const pid = row.personId
  listTagByPerson(pid).then(res => { detailTags.value = res.data || [] })
  listRelationByPerson(pid).then(res => { detailRelations.value = res.data || [] })
  listCareerByPerson(pid).then(res => { detailCareers.value = res.data || [] })
  listPunishByPerson(pid).then(res => { detailPunishes.value = res.data || [] })
  listDeclareByPerson(pid).then(res => { detailDeclares.value = res.data || [] })
}

/** 风险评估：评估 + 写回 + 刷新档案 */
function handleEvaluate() {
  riskLoading.value = true
  applyRisk(detailPerson.value.personId).then(res => {
    riskResult.value = res.data
    // 写回后刷新列表行与详情头部
    getPerson(detailPerson.value.personId).then(response => {
      detailPerson.value = response.data
    })
    getList()
    riskLoading.value = false
  }).catch(() => { riskLoading.value = false })
}

getList()
</script>
