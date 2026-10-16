<template>
  <div class="app-container">
    <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
      <template #title>舞弊举报箱（企业版口径）</template>
      <div>
        举报提交后系统返回 16 位回执码，<b>仅此一次显示，请妥善保存</b>，凭回执码可随时查询办理进度、补充材料、与受理人双向留言并对办理结果评价满意度。
        您的身份信息（如实名举报）经加密存储，仅限授权人员在办案时解密查看；提交 IP 仅用于频率限制，不用于其他用途。
        <div v-if="standalone" style="margin-top: 4px">当前为独立举报箱页面（免登录）。</div>
      </div>
    </el-alert>

    <!-- ═══ 举报须知（段16） ═══ -->
    <el-card shadow="never" style="margin-bottom: 12px">
      <el-collapse>
        <el-collapse-item title="举报须知（受理范围 / 保密承诺 / 办理时限 / 留言与评价说明）">
          <div class="notice-body">
            <p><b>一、受理范围：</b>采购回扣、串标围标、虚报冒领、吃拿卡要、利益冲突及其他违反公司廉洁纪律的行为。请尽量写明时间、地点、人员、经过、涉及金额等要素，线索越具体越利于查证。</p>
            <p><b>二、保密承诺：</b>支持完全匿名举报。匿名举报不记录任何身份信息；实名举报的姓名、电话、身份证号经加密存储，仅限授权办案人员按权限解密查看，全程审计留痕。提交 IP 仅用于频率限制，不落库、不用于身份识别。</p>
            <p><b>三、办理时限：</b>举报受理后，系统按办理时限规则起算并自动亮黄灯/红灯预警；您可凭回执码随时查看当前办理状态。超期件将纳入督办清单并自动催办。</p>
            <p><b>四、双向留言：</b>提交后您可凭回执码与受理人双向留言补充线索或询问进度（已办结件通道关闭）；留言不落真名、不记 IP。受理人的回复在您下次打开留言页时可见。</p>
            <p><b>五、满意度评价：</b>办理结果反馈后，您可对本次办理进行 1-5 星满意度评价并可覆盖更新；评价结果用于对办理质量的复核与考核。</p>
            <p><b>六、温馨提示：</b>请实事求是、不得捏造事实诬告陷害他人；对借举报之名捏造事实的，将依法追究责任。</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

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

            <!-- ═══ 双向留言（段16） ═══ -->
            <el-divider content-position="left">双向留言</el-divider>
            <div class="msg-list" v-if="msgList.length > 0">
              <div v-for="m in msgList" :key="m.messageId" class="msg-item" :class="m.sender === 'reporter' ? 'msg-mine' : 'msg-theirs'">
                <div class="msg-meta">{{ m.sender === 'reporter' ? '我' : (m.senderName || '受理人') }} · {{ m.createTime }}</div>
                <div class="msg-bubble">{{ m.content }}</div>
              </div>
            </div>
            <el-empty v-else description="暂无留言，可向受理人补充说明或询问进度" :image-size="60" />
            <div style="display: flex; gap: 8px; margin-top: 8px">
              <el-input v-model="msgInput" type="textarea" :rows="2" maxlength="2000" show-word-limit
                        placeholder="输入留言（不落真名、不记 IP），Ctrl+Enter 发送" @keydown.ctrl.enter="sendMessage" />
              <el-button type="primary" :loading="msgSending" :disabled="!msgInput || msgClosed" @click="sendMessage">发送</el-button>
            </div>
            <div v-if="msgClosed" style="color: #909399; font-size: 12px; margin-top: 4px;">该举报已办结，留言通道已关闭。</div>

            <!-- ═══ 满意度评价（段16：反馈后开放） ═══ -->
            <template v-if="canRate">
              <el-divider content-position="left">满意度评价</el-divider>
              <div v-if="receiptResult.satisfaction" style="margin-bottom: 6px">
                <el-rate :model-value="receiptResult.satisfaction" disabled />
                <span style="color: #909399; font-size: 12px; margin-left: 8px">已于 {{ receiptResult.satisfactionTime }} 评价，可重新评分覆盖</span>
              </div>
              <el-rate v-model="rateStars" show-text :texts="['很不满', '不满', '一般', '满意', '非常满意']" style="margin-bottom: 8px" />
              <el-input v-model="rateComment" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="评价说明（选填）" />
              <el-button type="primary" style="margin-top: 8px" :loading="rating" :disabled="!rateStars" @click="submitRate">提交评价</el-button>
            </template>
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
import { submitPetition, queryByReceipt, appendMaterial, postMessageByReceipt, listMessagesByReceipt, rateByReceipt, getPublicDicts } from "@/api/jiancha/petition"
import { getCodeImg } from "@/api/login"

const { proxy } = getCurrentInstance()
// 段16：字典统一走公开端点（独立免登录页无法用鉴权字典接口，管理端入口也复用同一数据源）
const jc_petition_category = ref([])
const jc_petition_channel = ref([])
const jc_petition_status = ref([])
const jc_warn_level = ref([])

function loadPublicDicts() {
  getPublicDicts().then(res => {
    const d = res.data || {}
    jc_petition_category.value = d.jc_petition_category || []
    jc_petition_channel.value = d.jc_petition_channel || []
    jc_petition_status.value = d.jc_petition_status || []
    jc_warn_level.value = d.jc_warn_level || []
  }).catch(() => {})
}
loadPublicDicts()

// 独立免登录模式（路由 /public/box，不走系统 Layout）
const standalone = computed(() => window.location.hash.includes("/public/box") || window.location.pathname.endsWith("/public/box"))

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
    loadMessages()
    initRate()
  }).catch(() => { querying.value = false })
}

// ═══ 段16：双向留言 ═══
const msgList = ref([])
const msgInput = ref("")
const msgSending = ref(false)

const msgClosed = computed(() => {
  const s = receiptResult.value && receiptResult.value.status
  return s === "6" || s === "7"
})

// 反馈后可评价（状态 5 已反馈 / 6 已归档）
const canRate = computed(() => {
  const s = receiptResult.value && receiptResult.value.status
  return s === "5" || s === "6"
})

function loadMessages() {
  msgList.value = []
  if (!receiptCode.value) return
  listMessagesByReceipt(receiptCode.value.trim()).then(res => {
    msgList.value = res.data || []
  }).catch(() => {})
}

function sendMessage() {
  if (!msgInput.value || !msgInput.value.trim()) {
    proxy.$modal.msgError("请输入留言内容")
    return
  }
  if (msgClosed.value) {
    proxy.$modal.msgError("该举报已办结，留言通道已关闭")
    return
  }
  msgSending.value = true
  postMessageByReceipt(receiptCode.value.trim(), msgInput.value.trim()).then(() => {
    msgSending.value = false
    msgInput.value = ""
    loadMessages()
    proxy.$modal.msgSuccess("留言成功")
  }).catch(() => { msgSending.value = false })
}

// ═══ 段16：满意度评价 ═══
const rateStars = ref(0)
const rateComment = ref("")
const rating = ref(false)

function initRate() {
  rateStars.value = receiptResult.value && receiptResult.value.satisfaction ? receiptResult.value.satisfaction : 0
  rateComment.value = ""
}

function submitRate() {
  if (!rateStars.value) {
    proxy.$modal.msgError("请先选择星级")
    return
  }
  rating.value = true
  rateByReceipt(receiptCode.value.trim(), rateStars.value, rateComment.value).then(res => {
    rating.value = false
    receiptResult.value = res.data
    proxy.$modal.msgSuccess("评价成功，感谢您的反馈")
  }).catch(() => { rating.value = false })
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
/* 段16：留言对话气泡 */
.msg-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 2px;
  background: #fafbfc;
  border-radius: 6px;
}
.msg-item { margin-bottom: 10px; }
.msg-item.msg-mine { text-align: right; }
.msg-item.msg-theirs { text-align: left; }
.msg-meta { font-size: 11px; color: #909399; margin-bottom: 2px; }
.msg-bubble {
  display: inline-block;
  max-width: 82%;
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 13px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg-mine .msg-bubble { background: #ecf5ff; color: #303133; border: 1px solid #d9ecff; }
.msg-theirs .msg-bubble { background: #f0f9eb; color: #303133; border: 1px solid #e1f3d8; }
.notice-body { font-size: 13px; color: #606266; line-height: 1.9; }
.notice-body p { margin: 0 0 6px; }
</style>
