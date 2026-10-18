<template>
  <div class="app-container home">
    <el-row :gutter="16" class="mb8">
      <el-col :span="24">
        <el-card shadow="never" class="welcome-card">
          <div class="welcome-inner">
            <span class="welcome-badge">纪</span>
            <div>
              <h2 class="welcome-title">欢迎使用纪检监察助手</h2>
              <p class="welcome-sub">企业版 · v0.21.0 · 覆盖「廉洁档案 → 利益冲突申报 → 举报受理 → 线索管理 → 整改闭环 → 风险防控 → 供应商管理 → 数据看板」全流程</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :sm="12" :lg="8" v-for="item in modules" :key="item.title">
        <el-card shadow="hover" class="module-card" @click="go(item)">
          <div class="module-inner">
            <el-icon :size="34" :color="item.color"><component :is="item.icon" /></el-icon>
            <div>
              <div class="module-title">{{ item.title }}</div>
              <div class="module-desc">{{ item.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header><b>建设进度</b></template>
          <el-steps :active="8" align-center finish-status="success">
            <el-step title="P1 AI 抽象层" description="已完成" />
            <el-step title="P2 廉洁档案" description="已完成" />
            <el-step title="P3 问题线索" description="已完成" />
            <el-step title="P4 知识库 RAG" description="已完成" />
            <el-step title="P5 调查问责" description="已完成" />
            <el-step title="P6 数据看板" description="已完成" />
            <el-step title="P7 联调加固" description="已完成" />
            <el-step title="P8 二期扩展" description="v0.21.0 已完成" />
          </el-steps>
          <div class="progress-note">
            <span><b>当前版本</b> v0.21.0（2026-10-17）</span>
            <span><b>业务模块</b> 16 个 / 页面 35 个 / 数据表 51 张</span>
            <span><b>提醒</b> 右上角铃铛查看业务消息，系统巡检页可一键自检</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
const router = useRouter()

const modules = [
  { title: '廉洁档案', desc: '人员档案、处分记录、年度画像', icon: 'User', color: '#c0392b', path: '/jiancha/person' },
  { title: '利益冲突申报', desc: '年度/事项申报、核实比对、漏报督办、操作留痕', icon: 'Document', color: '#d48806', path: '/jiancha/declare' },
  { title: '问题线索', desc: '线索登记、初核、流转处置', icon: 'Search', color: '#b37f00', path: '/jiancha/clue' },
  { title: '知识库问答', desc: '制度与法规智能问答（需配置 AI 服务）', icon: 'ChatDotRound', color: '#1677ff', path: '/jiancha/kb/kbchat' },
  { title: '文档管理', desc: '制度文档上传、解析、入库', icon: 'FolderOpened', color: '#0958d9', path: '/jiancha/kb/kbdoc' },
  { title: '举报受理', desc: '举报箱、留言、催办、并案、满意度', icon: 'Bell', color: '#cf1322', path: '/jiancha/petition/petitionmanage' },
  { title: '整改闭环', desc: '问题台账、整改跟踪、销号把关', icon: 'Finished', color: '#389e0d', path: '/jiancha/rectify/rectifyissue' },
  { title: '风险防控', desc: '预警处置、规则配置、岗位模型、风险看板', icon: 'Warning', color: '#d46b08', path: '/jiancha/risk/riskalert' },
  { title: '供应商管理', desc: '建档、准入审查、关联排查、黑名单', icon: 'Van', color: '#722ed1', path: '/jiancha/supplier/supplierfile' },
  { title: '廉政意见回复', desc: '党风廉政意见函受理与回复', icon: 'ChatLineSquare', color: '#08979c', path: '/jiancha/reply/reply' },
  { title: '作风建设专项', desc: '作风问题受理、处置、看板', icon: 'Flag', color: '#c41d7f', path: '/jiancha/conduct/conduct' },
  { title: '数据看板', desc: '全系统数据汇总与可视化', icon: 'DataLine', color: '#2f54eb', path: '/jiancha/dashboard' },
]

function go(item) {
  if (item.path) {
    router.push(item.path)
  }
}
</script>

<style lang="scss" scoped>
.home {
  padding: 16px;
}
.welcome-card {
  .welcome-inner {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .welcome-badge {
    display: inline-block;
    width: 56px;
    height: 56px;
    line-height: 56px;
    border-radius: 12px;
    background: #c0392b;
    color: #fff;
    font-size: 30px;
    font-weight: 700;
    text-align: center;
    flex-shrink: 0;
  }
  .welcome-title {
    margin: 0 0 6px 0;
    font-size: 20px;
  }
  .welcome-sub {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}
.module-card {
  cursor: pointer;
  margin-bottom: 16px;
  .module-inner {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .module-title {
    font-size: 16px;
    font-weight: 600;
  }
  .module-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
.progress-note {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12px;
  color: #909399;
  b {
    color: #606266;
    font-weight: 600;
    margin-right: 4px;
  }
}
</style>
