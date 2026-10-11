<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div slot="header">文书模板</div>
          <el-menu @select="onSelectTemplate">
            <el-menu-item v-for="t in templateList" :key="t.templateId" :index="String(t.templateId)">
              <span>{{ t.templateName }}</span>
              <el-tag size="mini" type="info" style="margin-left:8px">{{ t.docType }}</el-tag>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card v-if="currentTemplate">
          <div slot="header">生成文书：{{ currentTemplate.templateName }}</div>
          <el-form :model="formData" label-width="130px">
            <el-form-item v-for="f in formFields" :key="f.key" :label="f.label" :required="f.required">
              <el-input v-if="f.type === 'textarea'" type="textarea" v-model="formData[f.key]" :rows="3" />
              <el-date-picker v-else-if="f.type === 'date'" v-model="formData[f.key]" type="date"
                placeholder="选择日期" value-format="yyyy-MM-dd" style="width:100%" />
              <el-input v-else v-model="formData[f.key]" />
            </el-form-item>
          </el-form>
          <div style="text-align:right">
            <el-button type="primary" :loading="loading" @click="onGenerate">生成文书草稿 + 量纪建议</el-button>
          </div>
        </el-card>
        <el-empty v-else description="请选择左侧文书模板" />

        <el-card v-if="result" style="margin-top:16px">
          <div slot="header">
            生成结果（AI 辅助，须人工定稿）
            <el-tag size="mini" type="warning" style="margin-left:8px">量纪建议仅作参考</el-tag>
          </div>
          <div class="result-wrap">
            <div class="wm-layer">{{ watermarkText }}</div>
            <div class="result-body">
              <h4>文书草稿</h4>
              <pre class="doc-text">{{ result.generatedContent }}</pre>

              <h4>量纪建议（仅供参考，须人工复核后认定）</h4>
              <pre class="doc-text">{{ result.penaltyAdvice }}</pre>

              <template v-if="result.clauseBasis && result.clauseBasis.length">
                <h4>依据出处</h4>
                <el-table :data="result.clauseBasis" size="mini" border>
                  <el-table-column prop="index" label="#" width="40" />
                  <el-table-column prop="docName" label="文件" />
                  <el-table-column prop="clauseNo" label="条款" width="120" />
                  <el-table-column prop="excerpt" label="摘录" show-overflow-tooltip />
                </el-table>
              </template>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { listReportTemplate, getReportTemplate, genReport } from '@/api/jiancha/report'

export default {
  name: 'ReportGenerate',
  data() {
    return {
      templateList: [],
      currentTemplate: null,
      formFields: [],
      formData: {},
      result: null,
      loading: false,
      watermarkText: ''
    }
  },
  created() {
    this.loadTemplates()
  },
  methods: {
    loadTemplates() {
      listReportTemplate().then(res => {
        this.templateList = res.rows || []
      })
    },
    onSelectTemplate(id) {
      getReportTemplate(id).then(res => {
        this.currentTemplate = res.data
        this.formFields = []
        this.formData = {}
        this.result = null
        try {
          this.formFields = JSON.parse(res.data.fieldsMeta || '[]')
        } catch (e) {
          this.formFields = []
        }
      })
    },
    onGenerate() {
      for (const f of this.formFields) {
        if (f.required && !this.formData[f.key]) {
          this.$message.warning('请填写：' + f.label)
          return
        }
      }
      this.loading = true
      genReport({ templateId: this.currentTemplate.templateId, params: { ...this.formData } })
        .then(res => {
          this.result = res.data
          const op = res.data.operator || ''
          const now = this.formatNow()
          this.watermarkText = Array(40).fill('操作人：' + op + '　' + now).join('\n')
        })
        .catch(() => {})
        .finally(() => { this.loading = false })
    },
    formatNow() {
      const d = new Date()
      const p = n => (n < 10 ? '0' + n : '' + n)
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
        p(d.getHours()) + ':' + p(d.getMinutes())
    }
  }
}
</script>

<style scoped>
.result-wrap { position: relative; }
.wm-layer {
  position: absolute; inset: 0; pointer-events: none;
  color: rgba(0, 0, 0, 0.08); font-size: 14px; line-height: 64px;
  white-space: pre-wrap; word-break: break-all;
  transform: rotate(-20deg); transform-origin: center; overflow: hidden; z-index: 1;
}
.result-body { position: relative; z-index: 2; }
.doc-text { white-space: pre-wrap; background: #fafafa; padding: 10px; border-radius: 4px; }
</style>
