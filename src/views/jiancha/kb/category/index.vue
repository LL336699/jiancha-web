<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="分类名称" prop="catName">
        <el-input v-model="queryParams.catName" placeholder="请输入分类名称" clearable style="width: 180px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="分类类型" prop="catType">
        <el-select v-model="queryParams.catType" placeholder="全部" clearable style="width: 150px">
          <el-option v-for="d in jc_kb_cat_type" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd()" v-hasPermi="['jiancha:kb:category:add']">新增分类</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="categoryList"
      row-key="categoryId"
      :default-expand-all="isExpandAll"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="catName" label="分类名称" width="260" />
      <el-table-column prop="catType" label="分类类型" align="center" width="120">
        <template #default="scope">
          <dict-tag :options="jc_kb_cat_type" :value="scope.row.catType" />
        </template>
      </el-table-column>
      <el-table-column prop="docCount" label="文档数" align="center" width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.docCount" type="info" size="small">{{ scope.row.docCount }}</el-tag>
          <span v-else style="color:#c0c4cc">0</span>
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" label="排序" align="center" width="80" />
      <el-table-column prop="status" label="状态" align="center" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="small">
            {{ scope.row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['jiancha:kb:category:add']">新增</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:kb:category:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:kb:category:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="categoryTreeForSelect"
            :props="{ value: 'categoryId', label: 'catName', children: 'children' }"
            value-key="categoryId"
            placeholder="选择上级分类"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="catName">
          <el-input v-model="form.catName" placeholder="请输入分类名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="分类类型" prop="catType">
          <el-select v-model="form.catType" placeholder="请选择分类类型" style="width: 100%">
            <el-option v-for="d in jc_kb_cat_type" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
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

<script setup name="KbCategory">
import { ref, reactive, toRefs, nextTick, getCurrentInstance } from 'vue'
import { listKbCategory, treeKbCategory, getKbCategory, addKbCategory, updateKbCategory, delKbCategory } from '@/api/jiancha/kbCategory'

const { proxy } = getCurrentInstance()
const { jc_kb_cat_type } = proxy.useDict('jc_kb_cat_type')

const categoryList = ref([])
const categoryTreeForSelect = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const title = ref('')
const isExpandAll = ref(true)
const refreshTable = ref(true)

const data = reactive({
  form: {},
  queryParams: {
    catName: undefined,
    catType: undefined
  },
  rules: {
    catName: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
    catType: [{ required: true, message: '分类类型不能为空', trigger: 'change' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }]
  }
})
const { form, queryParams, rules } = toRefs(data)

/** 查询分类树 */
function getList() {
  loading.value = true
  treeKbCategory().then(response => {
    const data = response.data || []
    categoryList.value = buildTreeWrapper(data)
    categoryTreeForSelect.value = [{ categoryId: 0, catName: '顶级分类', children: data }]
    loading.value = false
  }).catch(() => { loading.value = false })
}

/** 顶层用 0 作为根，便于 el-tree-select 展示 */
function buildTreeWrapper(list) {
  return list
}

/** 展开/折叠 */
function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => { refreshTable.value = true })
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    categoryId: undefined,
    parentId: 0,
    catName: undefined,
    catType: undefined,
    orderNum: 0,
    status: '0',
    remark: undefined
  }
  proxy.resetForm('formRef')
}

function handleQuery() {
  // 树结构不支持按名称过滤时直接重查；此处按条件重查（后端 list 接口支持平铺过滤，树接口返回全量）
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  getList()
}

function handleAdd(row) {
  reset()
  if (row && row.categoryId) {
    form.value.parentId = row.categoryId
  }
  open.value = true
  title.value = '新增知识库分类'
}

function handleUpdate(row) {
  reset()
  getKbCategory(row.categoryId).then(response => {
    form.value = response.data
    open.value = true
    title.value = '修改知识库分类'
  })
}

function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (valid) {
      if (form.value.categoryId !== undefined && form.value.categoryId !== null) {
        updateKbCategory(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addKbCategory(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除分类「' + row.catName + '」？该分类下若存在子分类或文档将无法删除。').then(() => {
    return delKbCategory(row.categoryId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

getList()
</script>
