# 纪检监察助手（JIANCHA）· 前端

企业级纪检监察智能辅助系统前端，Vue 3 + Element Plus + Vite + Pinia。

> 配套后端：[jiancha](https://github.com/LL336699/jiancha)（Spring Boot 3.5）。底座 [RuoYi-Vue3](https://github.com/yangzongzhuan/RuoYi-Vue3)（MIT），业务代码位于 `src/views/jiancha`、`src/api/jiancha`，不修改框架源码。

## 业务页面（35 个，16 个模块）

`src/views/jiancha/` 下按模块组织：

| 目录 | 模块 |
|---|---|
| archive | 廉洁档案（人员/利益冲突申报/申报统计） |
| clue | 问题线索 |
| kb | 知识库（问答/文档/分类） |
| report | 文书辅助（生成/记录） |
| petition | 举报受理（举报箱管理/举报箱/办理统计） |
| rectify | 整改闭环（问题台账/统计） |
| risk | 风险防控（预警/规则/岗位模型/看板） |
| supplier | 供应商管理（档案/关联排查/协议/黑名单/看板） |
| edu | 廉政教育（题库/试卷/考试/承诺书/看板） |
| reply | 廉政意见回复（办理/看板） |
| conduct | 作风建设专项（办理/看板） |
| asset | 涉案财物（登记/看板） |
| notify | 消息通知中心 |
| dashboard | 数据看板 |
| ops | 系统巡检 |

另有顶栏业务提醒铃铛 `src/layout/components/JcNotifyBell.vue`（30s 轮询未读 + 悬停下拉）与免登录举报箱路由 `/public/box`。

## 快速开始

```bash
npm install
npm run dev     # 开发：http://localhost:88，代理后端 8080
npm run build:prod
```

演示账号（配套后端 `jiancha_roles.sql`）：`admin / case01 / manager01 / dept01 / audit01 / demo`，密码统一 `demo123`。

## 许可

MIT License（基于 RuoYi-Vue3，保留原版权声明）。
