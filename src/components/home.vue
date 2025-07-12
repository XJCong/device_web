<script setup>
import { ref, computed, nextTick } from 'vue'
import { getDevices } from '@/api'

/* -------- 原始数据 -------- */
const devices       = ref([])
const currentPage   = ref(0)
const totalPages    = ref(1)

/* -------- 修改记录 -------- */
const originalRows = ref([])        // 修改前的行快照
const dirtyFlags   = ref([])        // 每行是否被修改

/* -------- 弹窗控制 -------- */
const showSubmitModal   = ref(false)
const showDiscardModal  = ref(false)

/* -------- 字段映射 -------- */
const fieldMapping = {
  lydwh: '使用单位号',
  lydwm: '使用单位名',
  zcbh: '设备编号',
  zcflh: '分类号',
  zcmc: '设备名称',
  ppxh: '品牌型号',
  gg: '规格',
  je: '金额',
  jldw: '计量单位',
  cj: '厂家',
  ggrq: '购置日期',
  xz: '现状',
  jfkm: '经费科目',
  cfdbh: '存放地编号',
  cfdmc: '存放地名称',
  syrbh: '使用人编号',
  syr: '使用人',
  jsr: '经手人',
  ywdh: '业务单号',
  shzt: '审核状态',
  jzr: '记帐人',
  rzrq: '入账时间',
  bz: '备注',
  zfby1: '字符备用1',
  zfby2: '字符备用2',
  szby1: '数字备用1',
  szby2: '数字备用2',
  rqby1: '日期备用1',
  srr: '输入人',
  srrq: '输入日期'
}

/* -------- 表格渲染字段 -------- */
const visibleFields = computed(() => {
  if (!devices.value.length) return []
  return Object.keys(devices.value[0]).filter(key =>
      devices.value.some(d => d[key] != null && String(d[key]).trim() !== '')
  )
})

/* -------- 获取数据 -------- */
const fetchDevices = async () => {
  try {
    const res = await getDevices(currentPage.value, 10)
    devices.value = res.data.data.content
    totalPages.value = res.data.data.totalPages

    // 保存原始快照并清空 dirty 标志
    originalRows.value = devices.value.map(r => ({ ...r }))
    dirtyFlags.value   = Array(devices.value.length).fill(false)
  } catch (e) {
    console.error(e)
  }
}

/* -------- 分页 -------- */
const nextPage = () => { if (currentPage.value < totalPages.value - 1) { currentPage.value++; fetchDevices() } }
const prevPage = () => { if (currentPage.value > 0) { currentPage.value--; fetchDevices() } }

/* -------- 单元格编辑 -------- */
const editing = ref({})

const updateValue = (index, key, val) => {
  devices.value[index][key] = val
  if (JSON.stringify(devices.value[index]) !== JSON.stringify(originalRows.value[index])) {
    dirtyFlags.value[index] = true
  } else {
    dirtyFlags.value[index] = false
  }
}

const saveEdit = (index, key) => {
  editing.value[index] = null
}

/* -------- 勾选框手动切换（取消勾选即放弃该行） -------- */
const toggleDirty = (index) => {
  if (!dirtyFlags.value[index]) return
  // 取消勾选 => 放弃该行修改
  devices.value[index] = { ...originalRows.value[index] }
  dirtyFlags.value[index] = false
}

/* -------- 是否有任意行被修改 -------- */
const hasDirty = computed(() => dirtyFlags.value.some(Boolean))

/* -------- 收集所有修改 -------- */
const collectChanges = () => {
  const list = []
  devices.value.forEach((row, idx) => {
    if (!dirtyFlags.value[idx]) return
    const original = originalRows.value[idx]
    const changed  = {}
    Object.keys(row).forEach(k => {
      if (row[k] !== original[k]) {
        changed[k] = { old: original[k], new: row[k] }
      }
    })
    list.push({ rowIndex: idx + 1, changes: changed })
  })
  return list
}

/* -------- 提交 & 放弃 -------- */
const handleSubmit = () => {
  showSubmitModal.value = true
}
const confirmSubmit = () => {
  // TODO: 调接口真正提交
  console.log('提交数据：', collectChanges())
  // 成功后重新拉取
  fetchDevices()
  showSubmitModal.value = false
}

const handleDiscard = () => {
  showDiscardModal.value = true
}
const confirmDiscard = () => {
  // 放弃全部修改
  devices.value.forEach((_, idx) => {
    if (dirtyFlags.value[idx]) {
      devices.value[idx] = { ...originalRows.value[idx] }
      dirtyFlags.value[idx] = false
    }
  })
  showDiscardModal.value = false
}
</script>

<template>
  <div class="device-container">
    <div style="margin-bottom:8px">
      <button @click="fetchDevices">刷新数据</button>
      <button @click="handleSubmit"   :disabled="!hasDirty">提交修改</button>
      <button @click="handleDiscard"  :disabled="!hasDirty">放弃修改</button>
    </div>

    <table class="device-table">
      <thead>
      <tr>
        <th width="30"><input type="checkbox" disabled /></th>
        <th>序号</th>
        <th v-for="k in visibleFields" :key="k">{{ fieldMapping[k] || k }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, idx) in devices" :key="row.id">
        <td>
          <input
              type="checkbox"
              :checked="dirtyFlags[idx]"
              @change="toggleDirty(idx)"
          />
        </td>
        <td>{{ idx + 1 }}</td>
        <td v-for="k in visibleFields" :key="k">
          <template v-if="k === 'lydwh' || k === 'zcbh'">
            {{ row[k] }}
          </template>
          <template v-else>
              <span
                  v-if="!editing[idx] || editing[idx] !== k"
                  @dblclick="editing[idx] = k"
                  class="editable-cell"
              >{{ row[k] }}</span>
            <input
                v-else
                type="text"
                :value="row[k]"
                @input="updateValue(idx, k, $event.target.value)"
                @blur="saveEdit(idx, k)"
                @keyup.enter="saveEdit(idx, k)"
                class="editable-input"
            />
          </template>
        </td>
      </tr>
      </tbody>
    </table>
  </div>

  <!-- 分页 -->
  <div class="pagination">
    <button @click="prevPage" :disabled="currentPage === 0">上一页</button>
    <span>第 {{ currentPage + 1 }} 页 / 共 {{ totalPages }} 页</span>
    <button @click="nextPage" :disabled="currentPage >= totalPages - 1">下一页</button>
  </div>

  <!-- 提交弹窗 -->
  <div v-if="showSubmitModal" class="modal-mask">
    <div class="modal">
      <h3>确认提交以下修改？</h3>
      <table class="modal-table">
        <thead>
        <tr><th>行号</th><th>字段</th><th>旧值</th><th>新值</th></tr>
        </thead>
        <tbody>
        <template v-for="item in collectChanges()" :key="item.rowIndex">
          <tr v-for="(v,k) in item.changes" :key="k">
            <td>{{ item.rowIndex }}</td>
            <td>{{ fieldMapping[k] || k }}</td>
            <td>{{ v.old }}</td>
            <td>{{ v.new }}</td>
          </tr>
        </template>
        </tbody>
      </table>
      <div class="modal-btns">
        <button @click="confirmSubmit">确定提交</button>
        <button @click="showSubmitModal=false">取消</button>
      </div>
    </div>
  </div>

  <!-- 放弃弹窗 -->
  <div v-if="showDiscardModal" class="modal-mask">
    <div class="modal">
      <h3>确认放弃以下修改？</h3>
      <table class="modal-table">
        <thead>
        <tr><th>行号</th><th>字段</th><th>旧值</th><th>新值</th></tr>
        </thead>
        <tbody>
        <template v-for="item in collectChanges()" :key="item.rowIndex">
          <tr v-for="(v,k) in item.changes" :key="k">
            <td>{{ item.rowIndex }}</td>
            <td>{{ fieldMapping[k] || k }}</td>
            <td>{{ v.old }}</td>
            <td>{{ v.new }}</td>
          </tr>
        </template>
        </tbody>
      </table>
      <div class="modal-btns">
        <button @click="confirmDiscard">确定放弃</button>
        <button @click="showDiscardModal=false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 原有样式保持不变，仅追加弹窗样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  max-width: 700px;
  max-height: 70vh;
  overflow: auto;
}
.modal-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}
.modal-table th,
.modal-table td {
  border: 1px solid #ddd;
  padding: 4px 8px;
  font-size: 14px;
}
.modal-btns {
  text-align: right;
}
.modal-btns button {
  margin-left: 8px;
}

.device-container {
  width: 100%;
  overflow-y: auto;
  margin-top: 16px;
  border: 1px solid #ddd;
  padding: 8px;
}

.device-table {
  width: 100%;
  min-width: fit-content;
  border-collapse: collapse;
}

.device-table th,
.device-table td {
  border: 1px solid #ddd;
  padding: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-table {
  width: auto; /* 让表格根据内容自动扩展 */
  table-layout: auto;
  border-collapse: collapse;
  min-width: 100%; /* 防止内容太少时表格塌陷 */
}
.pagination {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.pagination button {
  padding: 6px 12px;
  font-size: 14px;
}


.editable-input:focus {
  border-color: #0056b3; /* 聚焦时的边框颜色 */
  outline: 0; /* 移除聚焦时的默认轮廓 */
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25); /* 聚焦时的阴影效果 */
}


.editable-cell:hover {
  background-color: #e9f3fd; /* 鼠标悬停时的背景颜色 */
  border-color: #0056b3; /* 鼠标悬停时的边框颜色 */
}
.editable-cell,
.editable-input {
  display: inline-block;
  min-width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.2;
}

.editable-cell {
  background-color: #f0f8ff;
  border: 1px solid #01050e;
  cursor: pointer;
}

.editable-input {
  background-color: #e9f3fd;
  border: 1px solid #007bff;
  color: #495057;
  outline: none;
}
</style>