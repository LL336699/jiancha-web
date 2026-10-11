<template>
  <div class="app-container">
    <!-- ═══ 概览统计 ═══ -->
    <el-row :gutter="12" class="mb8">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-num">{{ overview.docTotal || 0 }}</div>
          <div class="stat-label">文档总数 · 分块 {{ overview.chunkTotal || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ overview.docReady || 0 }}</div>
          <div class="stat-label">已入库</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ (overview.docPending || 0) + (overview.docParsing || 0) }}</div>
          <div class="stat-label">待处理 / 解析中</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ overview.docFailed || 0 }}</div>
          <div class="stat-label">解析失败</div>
        </div>
      </el-col>
    </el-row>

    <!-- ═══ 查询条件 ═══ -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="文档名称" prop="docName">
        <el-input v-model="queryParams.docName" placeholder="请输入文档名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="分类" prop="categoryId">
        <el-tree-select
          v-model="queryParams.categoryId"
          :data="categoryTree"
          :props="{ value: 'categoryId', label: 'catName', children: 'children' }"
          value-key="categoryId"
          placeholder="全部分类"
          check-strictly
          clearable
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_kb_doc_status" :key="d.value" :label="d.label" :value="d.value" />
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
        <el-button type="primary" plain icon="Upload" @click="openUpload" v-hasPermi="['jiancha:kb:doc:upload']">上传文档</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDeleteBatch" v-hasPermi="['jiancha:kb:doc:remove']">批量删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- ═══ 文档列表 ═══ -->
    <el-table v-loading="loading" :data="docList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="文档名称" align="left" prop="docName" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="分类" align="center" prop="catName" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="类型" align="center" prop="docType" width="80" />
      <el-table-column label="发文机关" align="center" prop="issuer" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="生效日期" align="center" prop="effectiveDate" width="110" />
      <el-table-column label="失效日期" align="center" prop="expireDate" width="110">
        <template #default="scope">
          <span v-if="!scope.row.expireDate" style="color:#c0c4cc">长期有效</span>
          <span v-else-if="scope.row.expired" style="color:#f56c6c">{{ scope.row.expireDate }}（已失效）</span>
          <span v-else>{{ scope.row.expireDate }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分块数" align="center" prop="chunkCount" width="80" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :options="jc_kb_doc_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleChunks(scope.row)" v-hasPermi="['jiancha:kb:doc:query']">分块</el-button>
          <el-button link type="primary" icon="Refresh" @click="handleReingest(scope.row)" v-hasPermi="['jiancha:kb:doc:reingest']">重入库</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:kb:doc:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:kb:doc:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- ═══ 上传弹窗 ═══ -->
    <el-dialog title="上传文档并入库" v-model="uploadOpen" width="680px" append-to-body>
      <el-alert type="info" :closable="false" class="mb16">
        <template #title>
          支持 PDF / DOCX / XLSX / PPTX / TXT / MD 等格式。上传后系统将自动执行「解析 → 结构感知分块 → 向量化」，
          单文档通常 1-30 秒。扫描件（图片型 PDF）暂不支持 OCR，会提示需人工处理。
        </template>
      </el-alert>
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="归属分类" prop="categoryId">
          <el-tree-select
            v-model="uploadForm.categoryId"
            :data="categoryTree"
            :props="{ value: 'categoryId', label: 'catName', children: 'children' }"
            value-key="categoryId"
            placeholder="请选择归属分类"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
            drag
            style="width: 100%"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          </el-upload>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="发文机关" prop="issuer">
              <el-input v-model="uploadForm.issuer" placeholder="如：国务院" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文号" prop="docNo">
              <el-input v-model="uploadForm.docNo" placeholder="如：国办发〔2024〕1号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker v-model="uploadForm.effectiveDate" type="date" value-format="YYYY-MM-DD" placeholder="选择生效日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期" prop="expireDate">
              <el-date-picker v-model="uploadForm.expireDate" type="date" value-format="YYYY-MM-DD" placeholder="不填则长期有效" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>失效日期用于检索时强制排除。失效法规一旦被检索命中，将直接导致量纪依据错误。</template>
        </el-alert>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="uploading" @click="submitUpload">开始上传并入库</el-button>
          <el-button @click="uploadOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 修改元数据弹窗 ═══ -->
    <el-dialog title="修改文档信息" v-model="editOpen" width="600px" append-to-body>
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="文档名称">
          <el-input v-model="editForm.docName" />
        </el-form-item>
        <el-form-item label="归属分类">
          <el-tree-select
            v-model="editForm.categoryId"
            :data="categoryTree"
            :props="{ value: 'categoryId', label: 'catName', children: 'children' }"
            value-key="categoryId"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="发文机关">
              <el-input v-model="editForm.issuer" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文号">
              <el-input v-model="editForm.docNo" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="生效日期">
              <el-date-picker v-model="editForm.effectiveDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期">
              <el-date-picker v-model="editForm.expireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitEdit">确 定</el-button>
          <el-button @click="editOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ═══ 分块查看弹窗 ═══ -->
    <el-dialog :title="'分块明细 — ' + chunkDocName" v-model="chunkOpen" width="900px" append-to-body>
      <el-table :data="chunkList" v-loading="chunkLoading" max-height="520">
        <el-table-column label="#" prop="chunkIndex" width="60" align="center" />
        <el-table-column label="条款号" prop="clauseNo" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.clauseNo">{{ scope.row.clauseNo }}</span>
            <span v-else style="color:#c0c4cc">—</span>
          </template>
        </el-table-column>
        <el-table-column label="页码" prop="pageNo" width="70" align="center">
          <template #default="scope">{{ scope.row.pageNo || '—' }}</template>
        </el-table-column>
        <el-table-column label="分块内容" prop="content" :show-overflow-tooltip="true" min-width="420" />
      </el-table>
      <el-empty v-if="!chunkLoading && chunkList.length === 0" description="该文档暂无分块（可能解析失败或尚未入库）" />
    </el-dialog>
  </div>
</template>

<script setup name="KbDoc">
import { ref, reactive, toRefs, getCurrentInstance } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { listKbDoc, kbDocOverview, getKbDoc, getKbDocChunks, uploadKbDoc, updateKbDoc, reingestKbDoc, delKbDoc } from '@/api/jiancha/kbDoc'
import { treeKbCategory } from '@/api/jiancha/kbCategory'

const { proxy } = getCurrentInstance()
const { jc_kb_doc_status } = proxy.useDict('jc_kb_doc_status')

const docList = ref([])
const categoryTree = ref([])
const overview = ref({})
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const ids = ref([])
const multiple = ref(true)

const uploadOpen = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)

const editOpen = ref(false)
const chunkOpen = ref(false)
const chunkLoading = ref(false)
const chunkList = ref([])
const chunkDocName = ref('')

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    docName: undefined,
    categoryId: undefined,
    status: undefined
  },
  uploadForm: {},
  editForm: {},
  uploadRules: {
    categoryId: [{ required: true, message: '请选择归属分类', trigger: 'change' }]
  }
})
const { queryParams, uploadForm, editForm, uploadRules } = toRefs(data)

function getList() {
  loading.value = true
  listKbDoc(queryParams.value).then(response => {
    docList.value = response.rows || []
    total.value = response.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

function getOverview() {
  kbDocOverview().then(response => {
    overview.value = response.data || {}
  })
}

function getCategoryTree() {
  treeKbCategory().then(response => {
    categoryTree.value = [{ categoryId: 0, catName: '顶级分类', children: response.data || [] }]
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryParams.value.categoryId = undefined
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.docId)
  multiple.value = !selection.length
}

function openUpload() {
  uploadForm.value = {
    categoryId: undefined,
    issuer: undefined,
    docNo: undefined,
    effectiveDate: undefined,
    expireDate: undefined
  }
  uploadFile.value = null
  uploadOpen.value = true
  if (proxy.$refs.uploadRef) {
    proxy.$refs.uploadRef.clearFiles()
  }
}

function onFileChange(file) {
  uploadFile.value = file.raw
}

function onFileRemove() {
  uploadFile.value = null
}

function submitUpload() {
  if (!uploadForm.value.categoryId) {
    proxy.$modal.msgWarning('请选择归属分类')
    return
  }
  if (!uploadFile.value) {
    proxy.$modal.msgWarning('请选择要上传的文件')
    return
  }
  uploading.value = true
  uploadKbDoc(uploadFile.value, uploadForm.value.categoryId, uploadForm.value).then(response => {
    uploading.value = false
    const r = response.data || {}
    if (r.duplicated) {
      proxy.$modal.msgWarning('该文件已存在（内容哈希相同），已跳过入库')
    } else if (r.status === '解析失败') {
      proxy.$modal.msgError('解析失败：' + (r.parseError || '未知原因'))
    } else {
      proxy.$modal.msgSuccess('入库成功，共生成 ' + (r.chunkCount || 0) + ' 个分块')
    }
    uploadOpen.value = false
    getList()
    getOverview()
  }).catch(() => { uploading.value = false })
}

function handleUpdate(row) {
  getKbDoc(row.docId).then(response => {
    editForm.value = response.data
    editOpen.value = true
  })
}

function submitEdit() {
  updateKbDoc(editForm.value).then(() => {
    proxy.$modal.msgSuccess('修改成功')
    editOpen.value = false
    getList()
    getOverview()
  })
}

function handleReingest(row) {
  proxy.$modal.confirm('将重新解析并重建向量（原分块先清空）。确认继续？').then(() => {
    return reingestKbDoc(row.docId)
  }).then(response => {
    const r = response.data || {}
    if (r.status === '解析失败') {
      proxy.$modal.msgError('重新入库失败：' + (r.parseError || '未知原因'))
    } else {
      proxy.$modal.msgSuccess('重新入库完成，共 ' + (r.chunkCount || 0) + ' 个分块')
    }
    getList()
    getOverview()
  }).catch(() => {})
}

function handleChunks(row) {
  chunkDocName.value = row.docName
  chunkOpen.value = true
  chunkLoading.value = true
  chunkList.value = []
  getKbDocChunks(row.docId).then(response => {
    chunkList.value = response.data || []
    chunkLoading.value = false
  }).catch(() => { chunkLoading.value = false })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除文档「' + row.docName + '」？其分块与向量将一并删除。').then(() => {
    return delKbDoc(row.docId)
  }).then(() => {
    getList()
    getOverview()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handleDeleteBatch() {
  proxy.$modal.confirm('是否确认删除选中的 ' + ids.value.length + ' 个文档？').then(() => {
    return Promise.all(ids.value.map(id => delKbDoc(id)))
  }).then(() => {
    getList()
    getOverview()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

getList()
getOverview()
getCategoryTree()
</script>

<style scoped>
.stat-card {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  border-left: 4px solid #409eff;
}
.stat-card.stat-success { border-left-color: #67c23a; }
.stat-card.stat-warning { border-left-color: #e6a23c; }
.stat-card.stat-danger  { border-left-color: #f56c6c; }
.stat-num { font-size: 26px; font-weight: 600; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.mb16 { margin-bottom: 16px; }
</style>
