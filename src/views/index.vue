<template>
  <div class="app-container home">
    <el-row :gutter="16" class="mb8">
      <el-col :span="24">
        <el-card shadow="never" class="welcome-card">
          <div class="welcome-inner">
            <span class="welcome-badge">纪</span>
            <div>
              <h2 class="welcome-title">欢迎使用纪检监察助手</h2>
              <p class="welcome-sub">覆盖「教育提醒 → 举报受理 → 线索管理 → 廉洁档案 → 调查问责 → 数据看板」全流程的企业级辅助系统</p>
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
          <el-steps :active="activeStep" align-center>
            <el-step title="P1 AI 抽象层" description="已完成" />
            <el-step title="P2 廉洁档案" description="已完成" />
            <el-step title="P4 知识库 RAG" description="进行中" />
            <el-step title="P3 问题线索" description="待开始" />
            <el-step title="P8 数据看板" description="待开始" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
const router = useRouter()

const modules = [
  { title: '廉洁档案', desc: '人员档案、画像标签、关联关系与风险预警', icon: 'User', color: '#c0392b', path: '/person' },
  { title: '利益冲突申报', desc: '年度/事项申报、核实比对、漏报识别', icon: 'Document', color: '#d48806', path: '/declare' },
  { title: 'AI 问答', desc: '制度与法规智能问答（建设中）', icon: 'ChatDotRound', color: '#1677ff', path: '' }
]

const activeStep = 2

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
</style>
