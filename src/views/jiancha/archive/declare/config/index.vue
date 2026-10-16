<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="申报年度" prop="declareYear">
        <el-input-number v-model="queryParams.declareYear" :min="2020" :max="2100" controls-position="right" style="width: 130px" placeholder="年度" />
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="状态" clearable style="width: 130px">
          <el-option label="启用" value="1" />
          <el-option label="关闭" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['jiancha:archive:add']">新增配置</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="configList">
      <el-table-column label="配置ID" align="center" prop="configId" width="90" />
      <el-table-column label="申报年度" align="center" prop="declareYear" width="100" />
      <el-table-column label="集中申报截止日" align="center" prop="deadline" width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.deadline, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="enabled" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.enabled === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.enabled === '1' ? '启用' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="操作" width="160" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:archive:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:archive:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改配置 -->
    <el-dialog :title="title" v-model="open" width="480px" append-to-body>
      <el-form ref="configRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="申报年度" prop="declareYear">
          <el-input-number v-model="form.declareYear" :min="2020" :max="2100" controls-position="right" style="width: 100%" placeholder="如 2026" />
        </el-form-item>
        <el-form-item label="集中申报截止日" prop="deadline">
          <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" placeholder="选择截止日" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DeclareConfig">
import { listDeclareConfig, getDeclareConfig, addDeclareConfig, updateDeclareConfig, delDeclareConfig } from "@/api/jiancha/declare"

const { proxy } = getCurrentInstance()

const configList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    declareYear: undefined,
    enabled: undefined
  },
  rules: {
    declareYear: [{ required: true, message: "请输入申报年度", trigger: "blur" }],
    deadline: [{ required: true, message: "请选择集中申报截止日", trigger: "change" }],
    enabled: [{ required: true, message: "请选择启用状态", trigger: "change" }]
  }
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  listDeclareConfig(queryParams.value).then(response => {
    configList.value = response.rows
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
    configId: undefined,
    declareYear: new Date().getFullYear(),
    deadline: undefined,
    enabled: "1",
    remark: undefined
  }
  proxy.resetForm("configRef")
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
  title.value = "新增集中申报截止配置"
}

function handleUpdate(row) {
  reset()
  getDeclareConfig(row.configId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改集中申报截止配置"
  })
}

function submitForm() {
  proxy.$refs["configRef"].validate(valid => {
    if (valid) {
      if (form.value.configId != undefined) {
        updateDeclareConfig(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDeclareConfig(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除「' + row.declareYear + ' 年度」截止配置？').then(function() {
    return delDeclareConfig(row.configId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

getList()
</script>
