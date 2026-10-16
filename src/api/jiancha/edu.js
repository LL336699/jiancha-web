import request from '@/utils/request'

// ============ 题库管理 ============

// 查询题目列表（分页）
export function listQuestion(query) {
  return request({ url: '/jiancha/edu/question/list', method: 'get', params: query })
}

// 查询题目详情
export function getQuestion(questionId) {
  return request({ url: '/jiancha/edu/question/' + questionId, method: 'get' })
}

// 新增题目
export function addQuestion(data) {
  return request({ url: '/jiancha/edu/question', method: 'post', data: data })
}

// 修改题目
export function updateQuestion(data) {
  return request({ url: '/jiancha/edu/question', method: 'put', data: data })
}

// 删除题目（支持批量，逗号分隔）
export function delQuestion(questionIds) {
  return request({ url: '/jiancha/edu/question/' + questionIds, method: 'delete' })
}

// ============ 试卷管理 ============

// 查询试卷列表（分页）
export function listPaper(query) {
  return request({ url: '/jiancha/edu/paper/list', method: 'get', params: query })
}

// 已发布试卷（开考可选）
export function publishedPapers() {
  return request({ url: '/jiancha/edu/paper/published', method: 'get' })
}

// 查询试卷详情（含题目清单）
export function getPaper(paperId) {
  return request({ url: '/jiancha/edu/paper/' + paperId, method: 'get' })
}

// 新增试卷（选题组卷）
export function addPaper(data) {
  return request({ url: '/jiancha/edu/paper', method: 'post', data: data })
}

// 随机组卷（按类别/题型/难度规则自动抽题）
export function randomPaper(data) {
  return request({ url: '/jiancha/edu/paper/random', method: 'post', data: data })
}

// 修改试卷
export function updatePaper(data) {
  return request({ url: '/jiancha/edu/paper', method: 'put', data: data })
}

// 发布试卷
export function publishPaper(paperId) {
  return request({ url: '/jiancha/edu/paper/publish/' + paperId, method: 'put' })
}

// 关闭试卷
export function closePaper(paperId) {
  return request({ url: '/jiancha/edu/paper/close/' + paperId, method: 'put' })
}

// 删除试卷
export function delPaper(paperId) {
  return request({ url: '/jiancha/edu/paper/' + paperId, method: 'delete' })
}

// ============ 考试管理 ============

// 查询考试记录列表（分页）
export function listExam(query) {
  return request({ url: '/jiancha/edu/exam/list', method: 'get', params: query })
}

// 查询考试详情（含答题与错题）
export function getExam(examId) {
  return request({ url: '/jiancha/edu/exam/' + examId, method: 'get' })
}

// 开考（personId + personName 指定参考人）
export function startExam(paperId, personId, personName) {
  return request({ url: '/jiancha/edu/exam/start/' + paperId, method: 'post', params: { personId, personName } })
}

// 交卷（answers: [{questionId, myAnswer}]）
export function submitExam(data) {
  return request({ url: '/jiancha/edu/exam/submit', method: 'post', data: data })
}

// 弃考
export function abandonExam(examId) {
  return request({ url: '/jiancha/edu/exam/abandon/' + examId, method: 'put' })
}

// 个人错题本
export function wrongBook(personId) {
  return request({ url: '/jiancha/edu/exam/wrong/' + personId, method: 'get' })
}

// 个人考试进度
export function examProgress(personId) {
  return request({ url: '/jiancha/edu/exam/progress/' + personId, method: 'get' })
}

// ============ 廉洁承诺书 ============

// 查询承诺书列表（分页）
export function listCommitment(query) {
  return request({ url: '/jiancha/edu/commitment/list', method: 'get', params: query })
}

// 已发布承诺书（待签收）
export function publishedCommitments() {
  return request({ url: '/jiancha/edu/commitment/published', method: 'get' })
}

// 查询承诺书详情
export function getCommitment(commitId) {
  return request({ url: '/jiancha/edu/commitment/' + commitId, method: 'get' })
}

// 新增承诺书
export function addCommitment(data) {
  return request({ url: '/jiancha/edu/commitment', method: 'post', data: data })
}

// 修改承诺书
export function updateCommitment(data) {
  return request({ url: '/jiancha/edu/commitment', method: 'put', data: data })
}

// 发布承诺书
export function publishCommitment(commitId) {
  return request({ url: '/jiancha/edu/commitment/publish/' + commitId, method: 'put' })
}

// 关闭承诺书
export function closeCommitment(commitId) {
  return request({ url: '/jiancha/edu/commitment/close/' + commitId, method: 'put' })
}

// 删除承诺书
export function delCommitment(commitId) {
  return request({ url: '/jiancha/edu/commitment/' + commitId, method: 'delete' })
}

// 签收承诺书（personId + personName）
export function signCommitment(commitId, personId, personName) {
  return request({ url: '/jiancha/edu/commitment/sign/' + commitId, method: 'post', params: { personId, personName } })
}

// 承诺书签收进度
export function commitmentProgress(commitId) {
  return request({ url: '/jiancha/edu/commitment/progress/' + commitId, method: 'get' })
}

// ============ 统计 ============

// 廉政教育统计（题库/试卷/考试/承诺书）
export function eduStat() {
  return request({ url: '/jiancha/edu/stat', method: 'get' })
}
