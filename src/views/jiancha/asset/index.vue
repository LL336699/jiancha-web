<template>
  <div class="app-container">
    <!-- 查询区 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="财物编号" prop="assetNo">
        <el-input v-model="queryParams.assetNo" placeholder="编号模糊匹配" clearable style="width: 170px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="物品名称" prop="itemName">
        <el-input v-model="queryParams.itemName" placeholder="名称模糊匹配" clearable style="width: 150px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="涉案人员" prop="personName">
        <el-input v-model="queryParams.personName" placeholder="姓名模糊匹配" clearable style="width: 130px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="物品类别" prop="itemCategory">
        <el-select v-model="queryParams.itemCategory" placeholder="全部" clearable style="width: 150px">
          <el-option v-for="d in jc_asset_category" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
        </el-select>
      </el-form-item>
      <el-form-item label="财物来源" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="d in jc_asset_source" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
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
        <el-button type="primary" plain icon="el-icon-plus" @click="handleAdd" v-hasPermi="['jiancha:asset:add']">登记财物</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="el-icon-files" @click="batchOpen = true" v-hasPermi="['jiancha:asset:add']">批量登记</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="assetList" border fit>
      <el-table-column label="财物编号" prop="assetNo" width="140" :show-overflow-tooltip="true" />
      <el-table-column label="物品名称" prop="itemName" min-width="130" :show-overflow-tooltip="true" />
      <el-table-column label="类别" prop="itemCategory" width="100">
        <template #default="scope">
          <dict-tag :options="jc_asset_category" :value="scope.row.itemCategory" />
        </template>
      </el-table-column>
      <el-table-column label="来源" prop="sourceType" width="110">
        <template #default="scope">
          <dict-tag :options="jc_asset_source" :value="scope.row.sourceType" />
        </template>
      </el-table-column>
      <el-table-column label="涉案人员" prop="personName" width="90" :show-overflow-tooltip="true" />
      <el-table-column label="人员部门" prop="personDept" width="110" :show-overflow-tooltip="true" />
      <el-table-column label="数量" prop="itemQty" width="70" align="center">
        <template #default="scope">{{ scope.row.itemQty }}{{ scope.row.unit }}</template>
      </el-table-column>
      <el-table-column label="估值(元)" prop="estimatedValue" width="110" align="right">
        <template #default="scope">{{ formatAmount(scope.row.estimatedValue) }}</template>
      </el-table-column>
      <el-table-column label="保管人" prop="keeper" width="90" :show-overflow-tooltip="true" />
      <el-table-column label="存放地点" prop="storagePlace" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="扣押日期" prop="seizeDate" width="110">
        <template #default="scope">{{ parseTime(scope.row.seizeDate, "{y}-{m}-{d}") }}</template>
      </el-table-column>
      <el-table-column label="处置期限" prop="disposeDeadline" width="110">
        <template #default="scope">{{ parseTime(scope.row.disposeDeadline, "{y}-{m}-{d}") }}</template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="95" align="center">
        <template #default="scope">
          <el-tag :type="statusTagType[scope.row.status] || 'info'">{{ statusMap[scope.row.status] || scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余天数" prop="remainDays" width="90" align="center">
        <template #default="scope">
          <span v-if="scope.row.remainDays == null">—</span>
          <span v-else-if="scope.row.remainDays < 0" style="color:#F56C6C;font-weight:600">{{ scope.row.remainDays }}</span>
          <span v-else-if="scope.row.remainDays <= 7" style="color:#E6A23C;font-weight:600">{{ scope.row.remainDays }}</span>
          <span v-else>{{ scope.row.remainDays }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="330" fixed="right" align="center">
        <template #default="scope">
          <el-button type="text" icon="el-icon-view" @click="handleDetail(scope.row)">详情</el-button>
          <el-button v-if="scope.row.status === '0'" type="text" icon="el-icon-box" @click="handleStore(scope.row)" v-hasPermi="['jiancha:asset:store']">入库</el-button>
          <el-button v-if="scope.row.status === '1'" type="text" icon="el-icon-sort" @click="handleHandover(scope.row)" v-hasPermi="['jiancha:asset:store']">交接</el-button>
          <el-button v-if="scope.row.status === '1'" type="text" icon="el-icon-sell" @click="handleDisposeApply(scope.row)" v-hasPermi="['jiancha:asset:dispose']">处置申请</el-button>
          <el-button v-if="scope.row.status === '2'" type="text" icon="el-icon-finished" @click="handleDisposeDone(scope.row)" v-hasPermi="['jiancha:asset:dispose']">处置完成</el-button>
          <el-button v-if="scope.row.status === '1' || scope.row.status === '2'" type="text" icon="el-icon-refresh" @click="handleRefund(scope.row)" v-hasPermi="['jiancha:asset:dispose']">退还</el-button>
          <el-button v-if="scope.row.status === '0'" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['jiancha:asset:edit']">修改</el-button>
          <el-button v-if="scope.row.status === '0'" type="text" icon="el-icon-delete" style="color:#F56C6C" @click="handleDelete(scope.row)" v-hasPermi="['jiancha:asset:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 登记/修改弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="formOpen" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="涉案人员" prop="personName">
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
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="物品名称" prop="itemName">
              <el-input v-model="form.itemName" placeholder="如：涉案银行卡" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物品类别" prop="itemCategory">
              <el-select v-model="form.itemCategory" placeholder="请选择" style="width:100%">
                <el-option v-for="d in jc_asset_category" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="数量" prop="itemQty">
              <el-input-number v-model="form.itemQty" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="form.unit" placeholder="如：张" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="估值(元)" prop="estimatedValue">
              <el-input-number v-model="form.estimatedValue" :min="0" :precision="2" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="财物来源" prop="sourceType">
              <el-select v-model="form.sourceType" placeholder="请选择" style="width:100%">
                <el-option v-for="d in jc_asset_source" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源单号" prop="sourceNo">
              <el-input v-model="form.sourceNo" placeholder="如：线索编号/信访编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="扣押日期" prop="seizeDate">
              <el-date-picker v-model="form.seizeDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处置期限" prop="disposeDeadline">
              <el-date-picker v-model="form.disposeDeadline" type="date" value-format="yyyy-MM-dd" placeholder="选择处置期限" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="formOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 批量登记弹窗 -->
    <el-dialog title="批量登记财物" :visible.sync="batchOpen" width="860px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom:10px">
        一次登记多件财物（同一涉案人员同一批次），系统自动逐件编号。
      </el-alert>
      <el-row :gutter="12" style="margin-bottom:10px">
        <el-col :span="12">
          <div style="display:flex;gap:8px">
            <el-input v-model="batchPersonName" placeholder="涉案人员（点击选择）" readonly style="flex:1" />
            <el-button icon="el-icon-search" @click="personOpen = true" />
          </div>
        </el-col>
        <el-col :span="12">
          <el-input v-model="batchPersonDept" placeholder="人员部门" />
        </el-col>
      </el-row>
      <el-table :data="batchRows" border size="small">
        <el-table-column label="物品名称" min-width="140">
          <template #default="scope">
            <el-input v-model="scope.row.itemName" size="small" placeholder="物品名称" />
          </template>
        </el-table-column>
        <el-table-column label="类别" width="130">
          <template #default="scope">
            <el-select v-model="scope.row.itemCategory" size="small" placeholder="类别">
              <el-option v-for="d in jc_asset_category" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="90">
          <template #default="scope">
            <el-input-number v-model="scope.row.itemQty" size="small" :min="1" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="单位" width="70">
          <template #default="scope">
            <el-input v-model="scope.row.unit" size="small" placeholder="张" />
          </template>
        </el-table-column>
        <el-table-column label="估值(元)" width="120">
          <template #default="scope">
            <el-input-number v-model="scope.row.estimatedValue" size="small" :min="0" :precision="2" controls-position="right" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="scope">
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="batchRows.splice(scope.$index, 1)" />
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:8px">
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="batchRows.push({ itemName: '', itemCategory: undefined, itemQty: 1, unit: '', estimatedValue: undefined })">添加一行</el-button>
      </div>
      <div slot="footer">
        <el-button type="primary" @click="submitBatch">确认登记（{{ batchRows.length }} 件）</el-button>
        <el-button @click="batchOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 入库弹窗（0 → 1） -->
    <el-dialog title="入库登记" :visible.sync="storeOpen" width="480px" append-to-body>
      <el-form ref="storeRef" :model="actionForm" :rules="storeRules" label-width="100px">
        <el-form-item label="保管人" prop="keeper">
          <el-input v-model="actionForm.keeper" placeholder="财物保管责任人" />
        </el-form-item>
        <el-form-item label="存放地点" prop="storagePlace">
          <el-input v-model="actionForm.storagePlace" placeholder="如：纪检档案室 A 柜" />
        </el-form-item>
        <el-form-item label="入库日期" prop="actionDate">
          <el-date-picker v-model="actionForm.actionDate" type="date" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="凭证号" prop="voucherNo">
          <el-input v-model="actionForm.voucherNo" placeholder="移交凭证编号（选填）" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="actionForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitStore">确认入库</el-button>
        <el-button @click="storeOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 交接弹窗（1 → 1） -->
    <el-dialog title="保管交接" :visible.sync="handoverOpen" width="480px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        交接将变更保管人并留存流转流水。当前保管人：{{ currentRow.keeper }}
      </el-alert>
      <el-form ref="handoverRef" :model="actionForm" :rules="handoverRules" label-width="100px">
        <el-form-item label="移交至" prop="handoverTo">
          <el-input v-model="actionForm.handoverTo" placeholder="新保管人姓名" />
        </el-form-item>
        <el-form-item label="交接日期" prop="actionDate">
          <el-date-picker v-model="actionForm.actionDate" type="date" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="凭证号" prop="voucherNo">
          <el-input v-model="actionForm.voucherNo" placeholder="交接凭证编号（选填）" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="actionForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitHandover">确认交接</el-button>
        <el-button @click="handoverOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 处置申请弹窗（1 → 2） -->
    <el-dialog title="处置申请" :visible.sync="disposeApplyOpen" width="480px" append-to-body>
      <el-form ref="disposeApplyRef" :model="actionForm" :rules="disposeApplyRules" label-width="100px">
        <el-form-item label="处置方式" prop="disposeType">
          <el-select v-model="actionForm.disposeType" placeholder="请选择处置方式" style="width:100%">
            <el-option v-for="d in jc_asset_dispose" :key="d.dictValue" :label="d.dictLabel" :value="d.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置期限" prop="disposeDeadline">
          <el-date-picker v-model="actionForm.disposeDeadline" type="date" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="处置说明" prop="disposeDesc">
          <el-input v-model="actionForm.disposeDesc" type="textarea" :rows="2" placeholder="处置依据与方案" />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="actionForm.operator" placeholder="经办人" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitDisposeApply">提交申请</el-button>
        <el-button @click="disposeApplyOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 处置完成弹窗（2 → 3） -->
    <el-dialog title="处置完成" :visible.sync="disposeDoneOpen" width="480px" append-to-body>
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        申请处置方式：{{ dictLabel(jc_asset_dispose, currentRow.disposeType) }}
      </el-alert>
      <el-form ref="disposeDoneRef" :model="actionForm" :rules="disposeDoneRules" label-width="100px">
        <el-form-item label="处置日期" prop="actionDate">
          <el-date-picker v-model="actionForm.actionDate" type="date" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="凭证号" prop="voucherNo">
          <el-input v-model="actionForm.voucherNo" placeholder="处置凭证编号（如拍卖成交确认书号）" />
        </el-form-item>
        <el-form-item label="处置说明" prop="disposeDesc">
          <el-input v-model="actionForm.disposeDesc" type="textarea" :rows="2" placeholder="实际处置结果" />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="actionForm.operator" placeholder="经办人" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitDisposeDone">确认完成</el-button>
        <el-button @click="disposeDoneOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 退还弹窗（→ 4） -->
    <el-dialog title="退还财物" :visible.sync="refundOpen" width="480px" append-to-body>
      <el-alert type="warning" :closable="false" style="margin-bottom:12px">
        退还后财物流程终结（状态：已退还），请确保已履行退还手续。
      </el-alert>
      <el-form ref="refundRef" :model="actionForm" :rules="refundRules" label-width="100px">
        <el-form-item label="退还日期" prop="actionDate">
          <el-date-picker v-model="actionForm.actionDate" type="date" value-format="yyyy-MM-dd" style="width:100%" />
        </el-form-item>
        <el-form-item label="凭证号" prop="voucherNo">
          <el-input v-model="actionForm.voucherNo" placeholder="退还签收凭证编号" />
        </el-form-item>
        <el-form-item label="退还说明" prop="disposeDesc">
          <el-input v-model="actionForm.disposeDesc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="actionForm.operator" placeholder="经办人" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitRefund">确认退还</el-button>
        <el-button @click="refundOpen = false">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉（含流转流水） -->
    <el-drawer title="涉案财物详情" :visible.sync="detailOpen" size="680px" append-to-body>
      <div v-loading="detailLoading" style="padding:0 16px 16px">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="财物编号">{{ detail.assetNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType[detail.status] || 'info'">{{ statusMap[detail.status] || detail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="物品名称">{{ detail.itemName }}</el-descriptions-item>
          <el-descriptions-item label="物品类别">{{ dictLabel(jc_asset_category, detail.itemCategory) }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ detail.itemQty }}{{ detail.unit }}</el-descriptions-item>
          <el-descriptions-item label="估值(元)">{{ formatAmount(detail.estimatedValue) }}</el-descriptions-item>
          <el-descriptions-item label="涉案人员">{{ detail.personName }}</el-descriptions-item>
          <el-descriptions-item label="人员部门">{{ detail.personDept }}</el-descriptions-item>
          <el-descriptions-item label="财物来源">{{ dictLabel(jc_asset_source, detail.sourceType) }}</el-descriptions-item>
          <el-descriptions-item label="来源单号">{{ detail.sourceNo || "—" }}</el-descriptions-item>
          <el-descriptions-item label="扣押日期">{{ parseTime(detail.seizeDate, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="入库日期">{{ parseTime(detail.storeDate, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="保管人">{{ detail.keeper || "—" }}</el-descriptions-item>
          <el-descriptions-item label="存放地点">{{ detail.storagePlace || "—" }}</el-descriptions-item>
          <el-descriptions-item label="处置方式">{{ dictLabel(jc_asset_dispose, detail.disposeType) }}</el-descriptions-item>
          <el-descriptions-item label="处置期限">{{ parseTime(detail.disposeDeadline, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="处置日期">{{ parseTime(detail.disposeDate, "{y}-{m}-{d}") }}</el-descriptions-item>
          <el-descriptions-item label="剩余天数">{{ detail.remainDays == null ? "—" : detail.remainDays }}</el-descriptions-item>
          <el-descriptions-item label="处置说明" :span="2">{{ detail.disposeDesc || "—" }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">流转流水（{{ flows.length }} 条）</el-divider>
        <el-timeline>
          <el-timeline-item v-for="f in flows" :key="f.flowId" :timestamp="parseTime(f.flowDate, '{y}-{m}-{d} {h}:{i}')" placement="top">
            <el-card shadow="never">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:600">{{ dictLabel(jc_asset_flow_type, f.flowType) }}</span>
                <el-tag size="mini">{{ f.fromStatus }} → {{ f.toStatus }}</el-tag>
              </div>
              <div style="color:#606266;font-size:13px;margin-top:4px">
                操作人：{{ f.operator || "—" }}{{ f.voucherNo ? "｜凭证：" + f.voucherNo : "" }}
              </div>
              <div v-if="f.flowDesc" style="color:#909399;font-size:12px;margin-top:2px">{{ f.flowDesc }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!flows.length" description="暂无流转记录" :image-size="60" />
      </div>
    </el-drawer>

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

<script setup name="AssetIndex">
import {
  listAsset, getAsset, addAsset, addAssetBatch, updateAsset, delAsset,
  storeAsset, handoverAsset, disposeApplyAsset, disposeDoneAsset, refundAsset,
  listAssetFlows, searchAssetPersons
} from "@/api/jiancha/asset"

const { proxy } = getCurrentInstance()
const { jc_asset_category, jc_asset_source, jc_asset_dispose, jc_asset_flow_type } =
  useDict("jc_asset_category", "jc_asset_source", "jc_asset_dispose", "jc_asset_flow_type")

const assetList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref({})
const flows = ref([])

const formOpen = ref(false)
const dialogTitle = ref("")
const form = ref({})

const storeOpen = ref(false)
const handoverOpen = ref(false)
const disposeApplyOpen = ref(false)
const disposeDoneOpen = ref(false)
const refundOpen = ref(false)
const personOpen = ref(false)
const batchOpen = ref(false)

const currentRow = ref({})
const actionForm = ref({})
const storeRules = {
  keeper: [{ required: true, message: "请填写保管人", trigger: "blur" }],
  storagePlace: [{ required: true, message: "请填写存放地点", trigger: "blur" }]
}
const handoverRules = {
  handoverTo: [{ required: true, message: "请填写新保管人", trigger: "blur" }]
}
const disposeApplyRules = {
  disposeType: [{ required: true, message: "请选择处置方式", trigger: "change" }]
}
const disposeDoneRules = {
  actionDate: [{ required: true, message: "请选择处置日期", trigger: "change" }],
  operator: [{ required: true, message: "请填写经办人", trigger: "blur" }]
}
const refundRules = {
  actionDate: [{ required: true, message: "请选择退还日期", trigger: "change" }],
  operator: [{ required: true, message: "请填写经办人", trigger: "blur" }],
  disposeDesc: [{ required: true, message: "请填写退还说明", trigger: "blur" }]
}

const batchRows = ref([])
const batchPersonName = ref("")
const batchPersonDept = ref("")

const personLoading = ref(false)
const personKeyword = ref("")
const persons = ref([])

const statusMap = { "0": "待入库", "1": "暂存中", "2": "处置中", "3": "已处置", "4": "已退还" }
const statusTagType = { "0": "warning", "1": "primary", "2": "warning", "3": "success", "4": "info" }

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    assetNo: undefined,
    itemName: undefined,
    personName: undefined,
    itemCategory: undefined,
    sourceType: undefined,
    status: undefined
  },
  formRules: {
    personName: [{ required: true, message: "请选择涉案人员", trigger: "change" }],
    itemName: [{ required: true, message: "请填写物品名称", trigger: "blur" }],
    itemCategory: [{ required: true, message: "请选择物品类别", trigger: "change" }],
    sourceType: [{ required: true, message: "请选择财物来源", trigger: "change" }],
    seizeDate: [{ required: true, message: "请选择扣押日期", trigger: "change" }]
  }
})
const { queryParams, formRules } = toRefs(data)

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
  listAsset(queryParams.value).then(response => {
    assetList.value = response.rows
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
  form.value = { itemQty: 1, unit: "" }
  dialogTitle.value = "登记涉案财物"
  formOpen.value = true
}

function handleUpdate(row) {
  form.value = Object.assign({}, row)
  dialogTitle.value = "修改财物 - " + row.assetNo
  formOpen.value = true
}

function submitForm() {
  proxy.$refs["formRef"].validate(valid => {
    if (valid) {
      if (form.value.assetId != null) {
        updateAsset(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          formOpen.value = false
          getList()
        })
      } else {
        addAsset(form.value).then(() => {
          proxy.$modal.msgSuccess("登记成功，状态为待入库")
          formOpen.value = false
          getList()
        })
      }
    }
  })
}

function submitBatch() {
  if (!batchPersonName.value) {
    proxy.$modal.msgError("请先选择涉案人员")
    return
  }
  const validRows = batchRows.value.filter(r => r.itemName)
  if (!validRows.length) {
    proxy.$modal.msgError("请至少填写一件财物")
    return
  }
  const payload = validRows.map(r => ({
    personName: batchPersonName.value,
    personDept: batchPersonDept.value,
    itemName: r.itemName,
    itemCategory: r.itemCategory,
    itemQty: r.itemQty || 1,
    unit: r.unit,
    estimatedValue: r.estimatedValue
  }))
  addAssetBatch(payload).then(() => {
    proxy.$modal.msgSuccess("批量登记成功（" + payload.length + " 件）")
    batchOpen.value = false
    getList()
  })
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除财物「' + row.assetNo + '」？').then(function () {
    return delAsset(row.assetId)
  }).then(() => {
    getList()
  }).catch(() => {})
}

/** 入库（0 → 1） */
function handleStore(row) {
  currentRow.value = row
  actionForm.value = { keeper: "", storagePlace: "", actionDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"), voucherNo: "", remark: "" }
  storeOpen.value = true
}

function submitStore() {
  proxy.$refs["storeRef"].validate(valid => {
    if (valid) {
      storeAsset(currentRow.value.assetId, actionForm.value).then(() => {
        proxy.$modal.msgSuccess("入库登记完成")
        storeOpen.value = false
        getList()
      })
    }
  })
}

/** 交接（1 → 1） */
function handleHandover(row) {
  currentRow.value = row
  actionForm.value = { handoverTo: "", actionDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"), voucherNo: "", remark: "" }
  handoverOpen.value = true
}

function submitHandover() {
  proxy.$refs["handoverRef"].validate(valid => {
    if (valid) {
      handoverAsset(currentRow.value.assetId, actionForm.value).then(() => {
        proxy.$modal.msgSuccess("保管交接完成")
        handoverOpen.value = false
        getList()
      })
    }
  })
}

/** 处置申请（1 → 2） */
function handleDisposeApply(row) {
  currentRow.value = row
  actionForm.value = { disposeType: undefined, disposeDeadline: undefined, disposeDesc: "", operator: "" }
  disposeApplyOpen.value = true
}

function submitDisposeApply() {
  proxy.$refs["disposeApplyRef"].validate(valid => {
    if (valid) {
      disposeApplyAsset(currentRow.value.assetId, actionForm.value).then(() => {
        proxy.$modal.msgSuccess("处置申请已提交")
        disposeApplyOpen.value = false
        getList()
      })
    }
  })
}

/** 处置完成（2 → 3） */
function handleDisposeDone(row) {
  currentRow.value = row
  actionForm.value = { actionDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"), voucherNo: "", disposeDesc: "", operator: "" }
  disposeDoneOpen.value = true
}

function submitDisposeDone() {
  proxy.$refs["disposeDoneRef"].validate(valid => {
    if (valid) {
      disposeDoneAsset(currentRow.value.assetId, actionForm.value).then(() => {
        proxy.$modal.msgSuccess("处置已完成")
        disposeDoneOpen.value = false
        getList()
      })
    }
  })
}

/** 退还（→ 4） */
function handleRefund(row) {
  currentRow.value = row
  actionForm.value = { actionDate: proxy.parseTime(new Date(), "{y}-{m}-{d}"), voucherNo: "", disposeDesc: "", operator: "" }
  refundOpen.value = true
}

function submitRefund() {
  proxy.$refs["refundRef"].validate(valid => {
    if (valid) {
      refundAsset(currentRow.value.assetId, actionForm.value).then(() => {
        proxy.$modal.msgSuccess("退还完成，流程终结")
        refundOpen.value = false
        getList()
      })
    }
  })
}

/** 详情：全字段 + 流转流水时间线 */
function handleDetail(row) {
  detail.value = {}
  flows.value = []
  detailOpen.value = true
  detailLoading.value = true
  getAsset(row.assetId).then(res => {
    detail.value = res.data || {}
    return listAssetFlows(row.assetId)
  }).then(res => {
    flows.value = res.data || []
    detailLoading.value = false
  }).catch(() => { detailLoading.value = false })
}

function searchPersons() {
  personLoading.value = true
  searchAssetPersons(personKeyword.value).then(res => {
    persons.value = res.data || []
    personLoading.value = false
  }).catch(() => { personLoading.value = false })
}

function pickPerson(row) {
  if (batchOpen.value) {
    batchPersonName.value = row.personName
    batchPersonDept.value = row.personDept || ""
  } else {
    form.value.personId = row.personId
    form.value.personName = row.personName
    form.value.personDept = row.personDept || ""
  }
  personOpen.value = false
}

getList()
</script>

<style scoped>
.mb8 { margin-bottom: 8px; }
</style>
