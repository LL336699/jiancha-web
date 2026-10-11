<template>
  <div class="app-container">
    <el-card>
      <div slot="header">文书生成记录（留痕溯源）</div>
      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="createTime" label="生成时间" width="160" />
        <el-table-column prop="docType" label="文书类型" width="120" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="deptName" label="部门" width="150" />
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="s">
            <el-button type="text" @click="openDetail(s.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" :page.sync="query.pageNum" :limit.sync="query.pageSize" @pagination="getList" />
    </el-card>

    <el-dialog title="文书详情（含水印溯源）" :visible.sync="dialogVisible" width="72%">
      <div class="result-wrap" v-if="detail">
        <div class="wm-layer">{{ watermarkText }}</div>
        <div class="result-body">
          <h4>文书草稿</h4>
          <pre class="doc-text">{{ detail.generatedContent }}</pre>
          <h4>量纪建议（仅供参考，须人工复核后认定）</h4>
          <pre class="doc-text">{{ detail.penaltyAdvice }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listReportRecord, getReportRecord } from '@/api/jiancha/report'

export default {
  name: 'ReportRecord',
  data() {
    return {
      list: [],
      total: 0,
      loading: false,
      query: { pageNum: 1, pageSize: 10 },
      dialogVisible: false,
      detail: null,
      watermarkText: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listReportRecord(this.query)
        .then(res => {
          this.list = res.rows || []
          this.total = res.total || 0
        })
        .finally(() => { this.loading = false })
    },
    openDetail(row) {
      getReportRecord(row.recordId).then(res => {
        this.detail = res.data
        const op = res.data.operator || ''
        const time = res.data.createTime || ''
        this.watermarkText = Array(30).fill('操作人：' + op + '　' + time).join('\n')
        this.dialogVisible = true
      })
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
