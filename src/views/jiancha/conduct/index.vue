<template>
  <div class="app-container">
    <!-- 查询区 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="问题编号" prop="issueNo">
        <el-input v-model="queryParams.issueNo" placeholder="编号模糊匹配" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="人员姓名" prop="personName">
        <el-input v-model="queryParams.personName" placeholder="姓名模糊匹配" clearable style="width: 140px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="问题类型" prop="violationType">
        <el-select v-model="queryParams.violationType" placeholder="全部" clearable style="width: 170px">
          <el-option v-for="d in jc_conduct_type" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
        </el-select>
      </el-form-item>
      <el-form-item label="严重度" prop="severity">
        <el-select v-model="queryParams.severity" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="d in jc_conduct_severity" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, value) in statusMap" :key="value" :label="label" :value="value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" @click="handleAdd" v-hasPermi="['jiancha:conduct:add']">登记问题</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="issueList" border fit>
      <el-table-column label="编号" prop="issueNo" width="150" :show-overflow-tooltip="true" />
      <el-table-column label="人员" prop="personName" width="90" :show-overflow-tooltip="true" />
      <el-table-column label="部门" prop="personDept" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="问题类型" prop="violationType" width="130">
        <template #default="scope">
          <dict-tag :options="jc_conduct_type" :value="scope.row.violationType" />
        </template>
      </el-table-column>
      <el-table-column label="发生日期" prop="violationDate" width="110">
        <template #default="scope">{{ parseTime(scope.row.violationDate, "{y}-{m}-{d}") }}</template>
      </el-table-column>
      <el-table-column label="涉及金额(元)" prop="amount" width="110" align="right">
        <template #default="scope">{{ scope.row.amount == null ? "—" : formatAmount(scope.row.amount) }}</template>
      </el-table-column>
      <el-table-column label="已退缴(元)" prop="amountRecovered" width="110" align="right">
        <template #default="scope">{{ scope.row.amountRecovered == null ? "—" : formatAmount(scope.row.amountRecovered) }}</template>
      </el-table-column>
      <el-table-column label="严重度" prop="severity" width="90" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.severity" :type="severityTagType[scope.row.severity] || 'info'" size="mini">
            {{ dictLabel(jc_conduct_severity, scope.row.severity) }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" prop="sourceType" width="100">
        <template #default="scope">{{ dictLabel(jc_conduct_source, scope.row.sourceType) }}</template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="100" align="center">
        <template #default="scope">
          <el-tag :type="statusTagType[scope.row.status] || 'info'">{{ statusMap[scope.row.status] || scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余天数" prop="remainDays" width="90" align="center">
        <template #default="scope">
          <span v-if="scope.row.remainDays == null">—</span>
          <span v-else-if="scope.row.remainDays < 0" style="color:#F56C6C;font-weight:600">{{ scope.row.remainDays }}</span>
          <span v-else-if="scope.row.remainDays <= 3" style="color:#E6A23C;font-weight:600">{{ scope.row.remainDays }}</span>
          <span v-else>{{ scope.row.remainDays }}</span>
        </template>
      </el-table-column>
      <el-table-column label="整改状态" prop="rectifyStatus" width="140" :show-overflow-tooltip="true">
        <template #default="scope">{{ scope.row.rectifyStatus || "—" }}</template>
      </el-table-column>
      <el-table-column label="操作" width="330" fixed="right" align="center">
        <template #default="scope">
          <el-button type="text" icon="el-icon-view" @click="handleDetail(scope.row)">详情</el-button>
          <el-button v-if="scope.row.status === '0'" type="text" icon="el-icon-s-check" @click="handleVerify(scope.row)" v-hasPermi="['jiancha:conduct:verify']">核查</el-button>
          <el-button v-if="scope.row.status === '1'" type="text" icon="el-icon-s-claim" @click="handleHandle(scope.row)" v-hasPermi="['jiancha:conduct:handle']">处理</el-button>
          <el-button v-if="scope.row.status === '1'" type="text" icon="el-icon-s-promotion" @click="handleTransferRectify(scope.row)" v-hasPermi="['jiancha:conduct:transfer']">转整改</el-button>
          <el-button v-if="scope.row.status === '1'" type="text" icon="el-icon-warning" @click="handleTransferPunish(scope.row)" v-hasPermi="['jiancha:conduct:transfer']">转处分</el-button>
          <el-button v-if="scope.row.status === '2'" type="text" icon="el-icon-close" @click="handleClose(scope.row)" v-hasPermi="['jiancha:conduct:close']">关闭</el-button>
          <el-button v-if="scope.row.status === '0' || scope.row.status === '1'" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:conduct:edit']">修改</el-button>
          <el-button v-if="scope.row.status === '4'" type="text" icon="el-icon-refresh-left" @click="handleRecovery(scope.row)" v-hasPermi="['jiancha:conduct:recovery']">恢复</el-button>
          <el-button v-if="scope.row.status === '0' || scope.row.status === '1'" type="text" icon="el-icon-delete" style="color:#F56C6C" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:conduct:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 登记/修改弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="formOpen" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="人员" prop="personName">
              <div style="display:flex;gap:8px">
                <el-input v-model="form.personName" placeholder="点击右侧按钮选择" readonly style="flex:1" />
                <el-button icon="el-icon-search" @click="personOpen = true" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人员部门" prop="personDept">
              <el-input v-model="form.personDept" placeholder="自动带出，可修改" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题类型" prop="violationType">
          <el-select v-model="form.violationType" placeholder="请选择问题类型" style="width:100%">
            <el-option v-for="d in jc_conduct_type" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="发生日期" prop="violationDate">
              <el-date-picker v-model="form.violationDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="问题来源" prop="sourceType">
              <el-select v-model="form.sourceType" placeholder="请选择来源" style="width:100%">
                <el-option v-for="d in jc_conduct_source" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述" prop="violationDesc">
          <el-input v-model="form.violationDesc" type="textarea" :rows="3" placeholder="违规事实描述" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="涉及金额(元)" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="核查期限" prop="checkDeadline">
              <el-date-picker v-model="form.checkDeadline" type="date" value-format="yyyy-MM-dd" placeholder="选择核查期限" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="formOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 核查弹窗（0 → 1） -->
    <el-dialog title="核查问题" :visible.sync="verifyOpen" width="560px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        问题：{{ currentRow.issueNo }}｜人员：{{ currentRow.personName }}｜描述：{{ currentRow.violationDesc }}
      </el-alert>
      <el-form ref="verifyRef" :model="verifyForm" :rules="verifyRules" label-width="110px">
        <el-form-item label="核查确认描述" prop="violationDesc">
          <el-input v-model="verifyForm.violationDesc" type="textarea" :rows="3" placeholder="核查确认的违规事实" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="涉及金额(元)" prop="amount">
              <el-input-number v-model="verifyForm.amount" :min="0" :precision="2" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重度" prop="severity">
              <el-select v-model="verifyForm.severity" placeholder="请选择" style="width:100%">
                <el-option v-for="d in jc_conduct_severity" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitVerify">确认核查</el-button>
        <el-button @click="verifyOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 处理弹窗（1 → 2） -->
    <el-dialog title="处理问题" :visible.sync="handleOpen" width="560px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        问题：{{ currentRow.issueNo }}｜涉及金额：{{ formatAmount(currentRow.amount) }} 元｜已退缴：{{ formatAmount(currentRow.amountRecovered) }} 元
      </el-alert>
      <el-form ref="handleRef" :model="handleForm" :rules="handleRules" label-width="110px">
        <el-form-item label="处理方式" prop="handleType">
          <el-select v-model="handleForm.handleType" placeholder="请选择处理方式" style="width:100%">
            <el-option v-for="d in jc_conduct_handle" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="处理日期" prop="handleDate">
              <el-date-picker v-model="handleForm.handleDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退缴金额(元)" prop="amountRecovered">
              <el-input-number v-model="handleForm.amountRecovered" :min="0" :precision="2" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="处理说明" prop="handleDesc">
          <el-input v-model="handleForm.handleDesc" type="textarea" :rows="3" placeholder="处理决定与依据" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
        <el-button @click="handleOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 转整改弹窗（1 → 2 + 生成整改台账） -->
    <el-dialog title="转整改" :visible.sync="rectifyOpen" width="560px" append-to-body>
      <el-alert type="warning" :closable="false" style="margin-bottom:12px">
        转整改将自动生成整改台账任务，并回写本问题的整改单号。
      </el-alert>
      <el-form ref="rectifyRef" :model="rectifyForm" :rules="rectifyRules" label-width="110px">
        <el-form-item label="整改任务标题" prop="rectifyTitle">
          <el-input v-model="rectifyForm.rectifyTitle" placeholder="如：XX部门违规发放津贴问题整改" />
        </el-form-item>
        <el-form-item label="责任部门" prop="rectifyDeptId">
          <el-input v-model="rectifyForm.rectifyDeptName" placeholder="责任部门名称" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="整改期限" prop="rectifyDeadline">
              <el-date-picker v-model="rectifyForm.rectifyDeadline" type="date" value-format="yyyy-MM-dd" placeholder="选择期限" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重度" prop="severity">
              <el-select v-model="rectifyForm.severity" placeholder="请选择" style="width:100%">
                <el-option v-for="d in jc_conduct_severity" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitTransferRectify">确认转整改</el-button>
        <el-button @click="rectifyOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 转处分弹窗（1 → 2 + 生成处分记录） -->
    <el-dialog title="转处分" :visible.sync="punishOpen" width="520px" append-to-body>
      <el-alert type="warning" :closable="false" style="margin-bottom:12px">
        转处分将自动生成处分记录，并回写本问题的处分单号。
      </el-alert>
      <el-form ref="punishRef" :model="punishForm" :rules="punishRules" label-width="110px">
        <el-form-item label="处分类型" prop="punishType">
          <el-select v-model="punishForm.punishType" placeholder="请选择处分类型" style="width:100%">
            <el-option v-for="d in jc_punish_type" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item label="处分事由" prop="punishReason">
          <el-input v-model="punishForm.punishReason" type="textarea" :rows="3" placeholder="处分依据与事由" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitTransferPunish">确认转处分</el-button>
        <el-button @click="punishOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 关闭/作废弹窗 -->
    <el-dialog :title="actionTitle" :visible.sync="actionOpen" width="480px" append-to-body>
      <el-form ref="actionRef" :model="actionForm" :rules="actionRules" label-width="90px">
        <el-form-item label="原因" prop="reason">
          <el-input v-model="actionForm.reason" type="textarea" :rows="3" :placeholder="actionPlaceholder" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitAction">确 定</el-button>
        <el-button @click="actionOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉（含退缴明细） -->
    <el-drawer title="作风问题详情" :visible.sync="detailOpen" size="680px" append-to-body>
      <div v-loading="detailLoading" style="padding:0 16px 16px">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="编号">{{ detail.issueNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType[detail.status] || 'info'">{{ statusMap[detail.status] || detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="人员">{{ detail.personName }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ detail.personDept }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">{{ dictLabel(jc_conduct_type, detail.violationType) }}</el-descriptions-item>
          <el-descriptions-item label="发生日期">{{ parseTime(detail.violationDate, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="问题来源">{{ dictLabel(jc_conduct_source, detail.sourceType) }}</el-descriptions-item>
          <el-descriptions-item label="严重度">{{ dictLabel(jc_conduct_severity, detail.severity) }}</el-descriptions-item>
          <el-descriptions-item label="涉及金额(元)">{{ formatAmount(detail.amount) }}</el-descriptions-item>
          <el-descriptions-item label="已退缴(元)">{{ formatAmount(detail.amountRecovered) }}</el-descriptions-item>
          <el-descriptions-item label="核查期限">{{ parseTime(detail.checkDeadline, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="剩余天数">{{ detail.remainDays == null ? "—" : detail.remainDays }}</el-descriptions-item>
          <el-descriptions-item label="处理方式">{{ dictLabel(jc_conduct_handle, detail.handleType) }}</el-descriptions-item>
          <el-descriptions-item label="处理日期">{{ parseTime(detail.handleDate, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="整改单号" :span="2">{{ detail.rectifyId ? "R" + detail.rectifyId : "—" }}</el-descriptions-item>
          <el-descriptions-item label="处分单号" :span="2">{{ detail.punishId ? "P" + detail.punishId : "—" }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ detail.violationDesc }}</el-descriptions-item>
          <el-descriptions-item label="处理说明" :span="2">{{ detail.handleDesc || "—" }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">
          退缴明细
          <el-button v-if="detail.status === '1' || detail.status === '2'" type="text" icon="el-icon-plus" @click="openRecoveryDialog" v-hasPermi="['jiancha:conduct:recovery']">登记退缴</el-button>
        </el-divider>
        <el-table :data="recoveries" border size="mini" empty-text="暂无退缴记录">
          <el-table-column label="物品/款项" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
          <el-table-column label="数量" prop="itemQty" width="70" align="center" />
          <el-table-column label="单位" prop="unit" width="60" align="center" />
          <el-table-column label="金额(元)" prop="amount" width="100" align="right">
            <template #default="scope">{{ formatAmount(scope.row.amount) }}</template>
          </el-table-column>
          <el-table-column label="退缴日期" prop="recoveryDate" width="110">
            <template #default="scope">{{ parseTime(scope.row.recoveryDate, "{y}-{m}-{d}") }}</template>
          </el-table-column>
          <el-table-column label="接收人" prop="receiver" width="90" />
          <el-table-column label="操作" width="70" align="center">
            <template #default="scope">
              <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="handleDelRecovery(scope.row)" v-hasPermi="['jiancha:conduct:recovery']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 登记退缴弹窗 -->
    <el-dialog title="登记退缴明细" :visible.sync="recoveryOpen" width="480px" append-to-body>
      <el-form ref="recoveryRef" :model="recoveryForm" :rules="recoveryRules" label-width="90px">
        <el-form-item label="物品/款项" prop="itemName">
          <el-input v-model="recoveryForm.itemName" placeholder="如：违规发放津贴" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="数量" prop="itemQty">
              <el-input-number v-model="recoveryForm.itemQty" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="recoveryForm.unit" placeholder="如：笔" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="金额(元)" prop="amount">
              <el-input-number v-model="recoveryForm.amount" :min="0" :precision="2" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="退缴日期" prop="recoveryDate">
          <el-date-picker v-model="recoveryForm.recoveryDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="接收人" prop="receiver">
          <el-input v-model="recoveryForm.receiver" placeholder="退缴款项接收人" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitRecovery">确 定</el-button>
        <el-button @click="recoveryOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 人员选择弹窗 -->
    <el-dialog title="选择人员" :visible.sync="personOpen" width="620px" append-to-body>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <el-input v-model="personKeyword" placeholder="姓名/部门关键字" clearable style="width:260px" @keyup.enter.native="searchPersons" />
        <el-button type="primary" icon="el-icon-search" @click="searchPersons">检索</el-button>
      </div>
      <el-table v-loading="personLoading" :data="persons" border size="small" height="320" @row-dblclick="pickPerson">
        <el-table-column label="姓名" prop="personName" width="100" />
        <el-table-column label="部门" prop="personDept" min-width="120" />
        <el-table-column label="职务" prop="jobTitle" min-width="120" />
        <el-table-column label="操作" width="70" align="center">
          <template #default="scope">
            <el-button type="text" @click="pickPerson(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="ConductIndex">
import {
  addConduct, listConduct, getConduct, updateConduct, delConduct,
  verifyConduct, handleConduct, transferConductRectify, transferConductPunish,
  closeConduct, cancelConduct, recoveryConduct,
  addConductRecovery, listConductRecoveries, delConductRecovery, searchConductPersons
} from "@/api/jiancha/conduct"

const { proxy } = getCurrentInstance()
const { jc_conduct_type, jc_conduct_source, jc_conduct_severity, jc_conduct_handle, jc_punish_type } =
  useDict("jc_conduct_type", "jc_conduct_source", "jc_conduct_severity", "jc_conduct_handle", "jc_punish_type")

const issueList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref({})
const recoveries = ref([])

const formOpen = ref(false)
const dialogTitle = ref("")
const form = ref({})

const currentRow = ref({})

// 各 action 弹窗开关
const verifyOpen = ref(false)
const handleOpen = ref(false)
const rectifyOpen = ref(false)
const punishOpen = ref(false)
const actionOpen = ref(false)
const recoveryOpen = ref(false)
const personOpen = ref(false)

// action 类型：close / cancel
const actionKind = ref("close")
const actionForm = ref({ reason: "" })
const verifyForm = ref({})
const handleForm = ref({})
const rectifyForm = ref({})
const punishForm = ref({})
const recoveryForm = ref({})

const personLoading = ref(false)
const personKeyword = ref("")
const persons = ref([])

const statusMap = { "0": "待核查", "1": "核查中", "2": "已处理", "3": "已关闭", "4": "已作废" }
const statusTagType = { "0": "warning", "1": "primary", "2": "success", "3": "info", "4": "danger" }
const severityTagType = { minor: "info", moderate: "warning", major: "danger", severe: "danger" }

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    issueNo: undefined,
    personName: undefined,
    violationType: undefined,
    severity: undefined,
    status: undefined
  },
  formRules: {
    personName: [{ required: true, message: "请选择人员", trigger: "change" }],
    violationType: [{ required: true, message: "请选择问题类型", trigger: "change" }],
    violationDate: [{ required: true, message: "请选择发生日期", trigger: "change" }],
    violationDesc: [{ required: true, message: "请填写问题描述", trigger: "blur" }],
    sourceType: [{ required: true, message: "请选择问题来源", trigger: "change" }]
  },
  verifyRules: {
    violationDesc: [{ required: true, message: "请填写核查确认描述", trigger: "blur" }],
    severity: [{ required: true, message: "请选择严重度", trigger: "change" }]
  },
  handleRules: {
    handleType: [{ required: true, message: "请选择处理方式", trigger: "change" }],
    handleDate: [{ required: true, message: "请选择处理日期", trigger: "change" }],
    handleDesc: [{ required: true, message: "请填写处理说明", trigger: "blur" }]
  },
  rectifyRules: {
    rectifyTitle: [{ required: true, message: "请填写整改任务标题", trigger: "blur" }],
    rectifyDeadline: [{ required: true, message: "请选择整改期限", trigger: "change" }]
  },
  punishRules: {
    punishType: [{ required: true, message: "请选择处分类型", trigger: "change" }],
    punishReason: [{ required: true, message: "请填写处分事由", trigger: "blur" }]
  },
  actionRules: {
    reason: [{ required: true, message: "请填写原因", trigger: "blur" }]
  },
  recoveryRules: {
    itemName: [{ required: true, message: "请填写物品/款项", trigger: "blur" }],
    amount: [{ required: true, message: "请填写金额", trigger: "blur" }],
    recoveryDate: [{ required: true, message: "请选择退缴日期", trigger: "change" }]
  }
})
const { queryParams, formRules, verifyRules, handleRules, rectifyRules, punishRules, actionRules, recoveryRules } = toRefs(data)

const actionTitle = computed(() => actionKind.value === "close" ? "关闭问题" : "作废问题")
const actionPlaceholder = computed(() => actionKind.value === "close" ? "关闭原因（办结意见）" : "作废原因（留痕）")

function formatAmount(v) {
  if (v == null || v === "") return "—"
  return Number(v).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dictLabel(options, val) {
  if (val == null || val === "") return "—"
  const hit = (options || []).find(d => d.dictValue === val)
  return hit ? hit.dictLabel : val
}

function getList() {
  loading.value = true
  listConduct(queryParams.value).then(response => {
    issueList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleAdd() {
  form.value = { violationType: undefined, sourceType: undefined }
  dialogTitle.value = "登记作风问题"
  formOpen.value = true
}

function handleUpdate(row) {
  form.value = Object.assign({}, row)
  dialogTitle.value = "修改问题 - " + row.issueNo
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.issueId != null) {
        updateConduct(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          formOpen.value = false
          getList()
        })
      } else {
        addConduct(form.value).then(() => {
          proxy.$modal.msgSuccess("登记成功")
          formOpen.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除问题「' + row.issueNo + '」？').then(function () {
    return delConduct(row.issueId)
  }).then(() => {
    getList()
  }).catch(() => {})
}

/** 核查（0 → 1） */
function handleVerify(row) {
  currentRow.value = row
  verifyForm.value = {
    violationDesc: row.violationDesc || "",
    amount: row.amount == null ? undefined : row.amount,
    severity: undefined
  }
  verifyOpen.value = true
}

function submitVerify() {
  proxy.$refs["verifyRef"].validate(valid => {
    if (valid) {
      verifyConduct(currentRow.value.issueId, verifyForm.value).then(() => {
        proxy.$modal.msgSuccess("核查完成，进入处理环节")
        verifyOpen.value = false
        getList()
      })
    }
  })
}

/** 处理（1 → 2） */
function handleHandle(row) {
  currentRow.value = row
  handleForm.value = {
    handleType: undefined,
    handleDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"),
    handleDesc: "",
    amountRecovered: row.amountRecovered == null ? undefined : row.amountRecovered
  }
  handleOpen.value = true
}

function submitHandle() {
  proxy.$refs["handleRef"].validate(valid => {
    if (valid) {
      handleConduct(currentRow.value.issueId, handleForm.value).then(() => {
        proxy.$modal.msgSuccess("处理完成")
        handleOpen.value = false
        getList()
      })
    }
  })
}

/** 转整改（1 → 2，生成整改台账） */
function handleTransferRectify(row) {
  currentRow.value = row
  rectifyForm.value = {
    rectifyTitle: row.personName + " " + dictLabel(jc_conduct_type.value, row.violationType) + "问题整改",
    rectifyDeptName: row.personDept || "",
    rectifyDeptId: undefined,
    rectifyDeadline: undefined,
    severity: row.severity
  }
  rectifyOpen.value = true
}

function submitTransferRectify() {
  proxy.$refs["rectifyRef"].validate(valid => {
    if (valid) {
      transferConductRectify(currentRow.value.issueId, rectifyForm.value).then(() => {
        proxy.$modal.msgSuccess("已转整改，整改台账任务已生成")
        rectifyOpen.value = false
        getList()
      })
    }
  })
}

/** 转处分（1 → 2，生成处分记录） */
function handleTransferPunish(row) {
  currentRow.value = row
  punishForm.value = { punishType: undefined, punishReason: "" }
  punishOpen.value = true
}

function submitTransferPunish() {
  proxy.$refs["punishRef"].validate(valid => {
    if (valid) {
      transferConductPunish(currentRow.value.issueId, punishForm.value).then(() => {
        proxy.$modal.msgSuccess("已转处分，处分记录已生成")
        punishOpen.value = false
        getList()
      })
    }
  })
}

/** 关闭 / 作废 */
function handleClose(row) {
  currentRow.value = row
  actionKind.value = "close"
  actionForm.value = { reason: "" }
  actionOpen.value = true
}

function handleCancel(row) {
  currentRow.value = row
  actionKind.value = "cancel"
  actionForm.value = { reason: "" }
  actionOpen.value = true
}

function submitAction() {
  proxy.$refs["actionRef"].validate(valid => {
    if (valid) {
      const action = actionKind.value === "close"
        ? closeConduct(currentRow.value.issueId, actionForm.value)
        : cancelConduct(currentRow.value.issueId, actionForm.value)
      action.then(() => {
        proxy.$modal.msgSuccess(actionKind.value === "close" ? "已关闭" : "已作废")
        actionOpen.value = false
        getList()
      })
    }
  })
}

/** 恢复（4 → 0） */
function handleRecovery(row) {
  proxy.$modal.confirm('确认恢复作废问题「' + row.issueNo + '」？').then(function () {
    return recoveryConduct(row.issueId)
  }).then(() => {
    proxy.$modal.msgSuccess("已恢复")
    getList()
  }).catch(() => {})
}

/** 详情：全字段 + 退缴明细 */
function handleDetail(row) {
  detail.value = {}
  recoveries.value = []
  detailOpen.value = true
  detailLoading.value = true
  getConduct(row.issueId).then(res => {
    detail.value = res.data || {}
    return listConductRecoveries(row.issueId)
  }).then(res => {
    recoveries.value = res.data || []
    detailLoading.value = false
  }).catch(() => { detailLoading.value = false })
}

function openRecoveryDialog() {
  recoveryForm.value = {
    itemName: "",
    itemQty: 1,
    unit: "笔",
    amount: undefined,
    recoveryDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"),
    receiver: ""
  }
  recoveryOpen.value = true
}

function submitRecovery() {
  proxy.$refs["recoveryRef"].validate(valid => {
    if (valid) {
      addConductRecovery(detail.value.issueId, recoveryForm.value).then(() => {
        proxy.$modal.msgSuccess("退缴登记成功，主表退缴额已自动汇总")
        recoveryOpen.value = false
        listConductRecoveries(detail.value.issueId).then(res => { recoveries.value = res.data || [] })
        getConduct(detail.value.issueId).then(res => { detail.value = res.data || {} })
        getList()
      })
    }
  })
}

function handleDelRecovery(row) {
  proxy.$modal.confirm('确认删除退缴记录「' + row.itemName + '」？删除后主表退缴额将重算。').then(function () {
    return delConductRecovery(row.recoveryId)
  }).then(() => {
    proxy.$modal.msgSuccess("已删除，退缴额已重算")
    listConductRecoveries(detail.value.issueId).then(res => { recoveries.value = res.data || [] })
    getConduct(detail.value.issueId).then(res => { detail.value = res.data || {} })
    getList()
  }).catch(() => {})
}

function searchPersons() {
  personLoading.value = true
  searchConductPersons(personKeyword.value).then(res => {
    persons.value = res.data || []
    personLoading.value = false
  }).catch(() => { personLoading.value = false })
}

function pickPerson(row) {
  form.value.personId = row.personId
  form.value.personName = row.personName
  form.value.personDept = row.personDept || ""
  personOpen.value = false
}

getList()
</script>

<style scoped>
.mb8 { margin-bottom: 8px; }
</style>
