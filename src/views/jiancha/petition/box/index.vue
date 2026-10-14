<template>
  <div class="app-container">
    <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
      <template #title>舞弊举报箱（企业版口径）</template>
      <div>
        举报提交后系统返回 16 位回执码，<b>仅此一次显示，请妥善保存</b>，凭回执码可随时查询办理进度、补充材料。
        您的身份信息（如实名举报）经加密存储，仅限授权人员在办案时解密查看；提交 IP 仅用于频率限制，不用于其他用途。
      </div>
    </el-alert>

    <el-row :gutter="12">
      <!-- ═══ 提交举报 ═══ -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header><span>提交举报</span></template>
          <el-form ref="submitRef" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="事由标题" prop="title">
              <el-input v-model="form.title" placeholder="一句话概括举报事由" maxlength="200" show-word-limit />
            </el-form-item>
            <el-form-item label="舞弊类型" prop="category">
              <el-select v-model="form.category" placeholder="请选择舞弊类型" style="width: 100%">
                <el-option v-for="d in jc_petition_category" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="举报内容" prop="content">
              <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请客观陈述时间、地点、人员、经过、金额等要素" maxlength="4000" show-word-limit />
            </el-form-item>
            <el-form-item label="被举报对象" prop="targetName">
              <el-input v-model="form.targetName" placeholder="选填，被举报人姓名" />
            </el-form-item>
            <el-form-item label="对象所在部门" prop="targetDept">
              <el-input v-model="form.targetDept" placeholder="选填，如采购部" />
            </el-form-item>
            <el-form-item label="涉及金额(元)" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 220px" placeholder="选填" />
            </el-form-item>
            <el-form-item label="提交渠道" prop="channel">
              <el-select v-model="form.channel" placeholder="请选择渠道" style="width: 220px">
                <el-option v-for="d in jc_petition_channel" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="实名/匿名">
              <el-radio-group v-model="form.anonymousFlag">
                <el-radio value="1">匿名举报</el-radio>
                <el-radio value="0">实名举报</el-radio>
              </el-radio-group>
            </el-form-item>
            <template v-if="form.anonymousFlag === '0'">
              <el-form-item label="举报人姓名" prop="reporterName">
                <el-input v-model="form.reporterName" placeholder="实名举报必填（加密存储）" />
              </el-form-item>
              <el-form-item label="举报人电话" prop="reporterPhone">
                <el-input v-model="form.reporterPhone" placeholder="用于必要时回访（加密存储）" />
              </el-form-item>
              <el-form-item label="身份证号" prop="reporterIdcard">
                <el-input v-model="form.reporterIdcard" placeholder="选填（加密存储）" />
              </el-form-item>
            </template>
            <el-form-item label="验证码" prop="captchaCode">
              <el-input v-model="form.captchaCode" placeholder="请输入验证码" style="width: 140px" />
              <img :src="captchaImg" alt="验证码" class="captcha-img" @click="refreshCaptcha" title="点击刷新" />
              <el-button link type="primary" @click="refreshCaptcha">刷新</el-button>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="submitForm">提交举报</el-button>
              <el-button @click="resetForm">重填</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- ═══ 回执查询 / 补充材料 ═══ -->
      <el-col :span="10">
        <el-card shadow="never" style="margin-bottom: 12px">
          <template #header><span>回执查询</span></template>
          <el-input v-model="receiptCode" placeholder="输入 16 位回执码" maxlength="19" style="width: 260px; margin-right: 8px" @keyup.enter="queryReceipt" />
          <el-button type="primary" icon="Search" :loading="querying" @click="queryReceipt">查询进度</el-button>
          <div v-if="receiptResult" style="margin-top: 12px">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="事由标题">{{ receiptResult.title }}</el-descriptions-item>
              <el-descriptions-item label="办理状态">
                <dict-tag :options="jc_petition_status" :value="receiptResult.status" />
              </el-descriptions-item>
              <el-descriptions-item label="预警级别">
                <dict-tag v-if="receiptResult.warnLevel" :options="jc_warn_level" :value="receiptResult.warnLevel" />
                <span v-else>正常</span>
              </el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ receiptResult.createTime }}</el-descriptions-item>
              <el-descriptions-item v-if="receiptResult.feedback" label="办理反馈">
                <span style="white-space: pre-wrap;">{{ receiptResult.feedback }}</span>
              </el-descriptions-item>
            </el-descriptions>
            <div style="margin-top: 6px; color: #909399; font-size: 12px;">为保护调查，办理过程明细不对外展示。</div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header><span>补充材料（凭回执码）</span></template>
          <el-input v-model="materialReceipt" placeholder="回执码" style="width: 100%; margin-bottom: 8px" />
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="onFileChange"
            :on-exceed="onFileExceed"
            :file-list="fileList"
            drag>
            <i class="el-icon-upload" />
            <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip">仅支持 pdf/doc/docx/txt/md/rtf/png/jpg/zip，单文件不超过 10MB</div>
            </template>
          </el-upload>
          <el-button type="primary" style="margin-top: 8px" :loading="uploading" :disabled="!selectedFile" @click="uploadMaterial">上传材料</el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- ═══ 回执码展示（仅此一次） ═══ -->
    <el-dialog title="提交成功 — 请妥善保存回执码" v-model="receiptOpen" width="480px" append-to-body>
      <div style="text-align: center; padding: 12px 0;">
        <p style="color: #f56c6c; font-weight: 600;">回执码仅此一次显示，遗失将无法查询进度！</p>
        <div class="receipt-code">{{ newReceipt }}</div>
        <el-button type="primary" plain icon="CopyDocument" @click="copyReceipt">复制回执码</el-button>
      </div>
      <template #footer>
        <el-button type="primary" @click="receiptOpen = false">我已保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PetitionBox">
import { submitPetition, queryByReceipt, appendMaterial } from "@/api/jiancha/petition"
import { getCodeImg } from "@/api/login"

const { proxy } = getCurrentInstance()
const { jc_petition_category, jc_petition_channel, jc_petition_status, jc_warn_level } =
  useDict("jc_petition_category", "jc_petition_channel", "jc_petition_status", "jc_warn_level")

const captchaImg = ref("")
const captchaUuid = ref("")
const submitting = ref(false)
const receiptOpen = ref(false)
const newReceipt = ref("")

const receiptCode = ref("")
const querying = ref(false)
const receiptResult = ref(null)

const materialReceipt = ref("")
const selectedFile = ref(null)
const fileList = ref([])
const uploading = ref(false)

const data = reactive({
  form: {
    title: undefined,
    content: undefined,
    category: undefined,
    channel: "web",
    anonymousFlag: "1",
    reporterName: undefined,
    reporterPhone: undefined,
    reporterIdcard: undefined,
    targetName: undefined,
    targetDept: undefined,
    amount: undefined,
    captchaUuid: undefined,
    captchaCode: undefined
  },
  rules: {
    title: [{ required: true, message: "请填写事由标题", trigger: "blur" }],
    category: [{ required: true, message: "请选择舞弊类型", trigger: "change" }],
    content: [{ required: true, message: "请填写举报内容", trigger: "blur" }],
    reporterName: [{ required: true, message: "实名举报请填写姓名", trigger: "blur" }],
    reporterPhone: [{ required: true, message: "实名举报请填写电话", trigger: "blur" }],
    captchaCode: [{ required: true, message: "请输入验证码", trigger: "blur" }]
  }
})

const { form, rules } = toRefs(data)

/** 拉取验证码（开关关闭时后端不校验，多填无害） */
function refreshCaptcha() {
  getCodeImg().then(res => {
    captchaUuid.value = res.uuid
    captchaImg.value = "data:image/gif;base64," + res.img
  })
}

function resetForm() {
  form.value.title = undefined
  form.value.content = undefined
  form.value.category = undefined
  form.value.targetName = undefined
  form.value.targetDept = undefined
  form.value.amount = undefined
  form.value.reporterName = undefined
  form.value.reporterPhone = undefined
  form.value.reporterIdcard = undefined
  form.value.captchaCode = undefined
  proxy.resetForm("submitRef")
  refreshCaptcha()
}

function submitForm() {
  proxy.$refs["submitRef"].validate(valid => {
    if (valid) {
      submitting.value = true
      form.value.captchaUuid = captchaUuid.value
      submitPetition(form.value).then(res => {
        submitting.value = false
        newReceipt.value = res.receiptCode
        receiptOpen.value = true
        resetForm()
      }).catch(() => {
        submitting.value = false
        refreshCaptcha()
      })
    }
  })
}

function copyReceipt() {
  const input = document.createElement("textarea")
  input.value = newReceipt.value
  document.body.appendChild(input)
  input.select()
  document.execCommand("copy")
  document.body.removeChild(input)
  proxy.$modal.msgSuccess("已复制")
}

function queryReceipt() {
  if (!receiptCode.value || receiptCode.value.trim().length === 0) {
    proxy.$modal.msgError("请输入回执码")
    return
  }
  querying.value = true
  queryByReceipt(receiptCode.value.trim()).then(res => {
    querying.value = false
    receiptResult.value = res.data
  }).catch(() => { querying.value = false })
}

function onFileChange(file) {
  selectedFile.value = file.raw
}

function onFileExceed() {
  proxy.$modal.msgError("每次仅可上传一个文件")
}

function uploadMaterial() {
  if (!materialReceipt.value) {
    proxy.$modal.msgError("请输入回执码")
    return
  }
  if (!selectedFile.value) {
    proxy.$modal.msgError("请选择文件")
    return
  }
  uploading.value = true
  appendMaterial(materialReceipt.value.trim(), selectedFile.value).then(() => {
    uploading.value = false
    proxy.$modal.msgSuccess("材料上传成功")
    fileList.value = []
    selectedFile.value = null
  }).catch(() => { uploading.value = false })
}

refreshCaptcha()
</script>

<style scoped>
.captcha-img {
  height: 32px;
  margin: 0 8px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  vertical-align: middle;
}
.receipt-code {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #303133;
  background: #f5f7fa;
  border: 1px dashed #409eff;
  border-radius: 6px;
  padding: 14px;
  margin: 12px 0 16px;
  font-family: "Courier New", monospace;
}
</style>
