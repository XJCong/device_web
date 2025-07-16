<script setup>
import {ref, computed, nextTick, onMounted, onBeforeUnmount} from 'vue'
import QRCode from 'qrcode';
import {getDevices, changeInfo, getPhotos, uploadPhoto, deletePhoto, getPermissions, getDeviceHistory,getDepartments,FilteredDevices} from '@/api'
import { useRouter } from 'vue-router'
import {Picture} from "@element-plus/icons-vue";
const router = useRouter()
import { ElMessage, ElDropdown, ElDropdownMenu, ElDropdownItem, ElBadge, ElIcon } from 'element-plus'


/* -------- 原始数据 -------- */
const devices       = ref([])
const currentPage   = ref(0)
const totalPages    = ref(1)
const departments   = ref([]) // 新增：存储使用单位列表
const filteredDevices=ref([]) // 新增：存储过滤后的设备列表
/* -------- 照片弹窗 -------- */
const showPhotoModal = ref(false)   // 弹窗开关
const photoModalZcbh = ref('')      // 当前弹窗所属设备编号
const photoModalList = ref([])      // 当前弹窗内的照片数组

/* -------- 修改记录 -------- */
const originalRows = ref([])        // 修改前的行快照
const dirtyFlags   = ref([])



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
  je: '金额(/rmb)',
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
/* -------- 权限映射 -------- */
const permissionMapping = ({

})

/* -------- 表格渲染字段 -------- */
const visibleFields = computed(() => {
  if (!devices.value.length) return []
  return Object.keys(devices.value[0]).filter(key =>
      devices.value.some(d => d[key] != null && String(d[key]).trim() !== '')
  )
})

/* -------- 实物照片 -------- */
const photoMap = ref({}) // { zcbh: [{id, thumbUrl, url}, ...] }

/* 获取使用单位列表 */
const fetchDepartments = async () => {
  try {
    const { data } = await getDepartments();
    console.log('获取单位列表:', data);

    departments.value = data || []; // 直接使用后端格式化好的数据

    // 如果需要处理可能的空值
    departments.value = (data || []).map(dept => ({
      value: dept.value || '',
      label: dept.label || '未知单位'
    }));

  } catch (e) {
    console.error('获取单位列表失败:', e);
    departments.value = [];
  }
}

const fetchFilteredDevices= async (zcmc) => {
  try{
    const { data } = await FilteredDevices(zcmc);
    filteredDevices.value = data || [];
    console.log('获取过滤后的设备列表:', data);

    // 如果需要处理可能的空值
    filteredDevices.value = (data || []).map(dept => ({
      value: dept.value || '',
      label: dept.label || '未知单位'
    }));
    } catch (e) {
    console.error('获取过滤后的设备列表失败:', e);
    filteredDevices.value = [];
  }
}

/* 获取某设备的照片列表（含缩略图） */
const fetchPhotos = async (zcbh) => {
  try {
    const { data } = await getPhotos(zcbh)
    photoMap.value[zcbh] = data || []
    console.log(`获取设备 ${zcbh} 照片列表成功`)
    console.log(photoMap.value[zcbh])
  } catch {
    photoMap.value[zcbh] = []
    console.error(`获取设备 ${zcbh} 照片列表失败`)
  }
}
// 修改历史相关
const showHistoryModal = ref(false)
const historyList = ref([])

const fetchHistory = async (zcbh) => {
  try {
    const { data } = await getDeviceHistory(zcbh)
    historyList.value = data?.content || [] // 从 content 提取数据
    console.log(`获取设备 ${zcbh} 修改历史成功`)
    console.log(historyList.value)
  } catch (error) {
    console.error('获取修改历史失败:', error)
    ElMessage.error('获取修改历史失败')
  }
}


/* -------- 获取数据 -------- */
const fetchDevices = async () => {
  try {
    const res = await getDevices(currentPage.value, 10)
    devices.value = res.data.data.content
    totalPages.value = res.data.data.page.totalPages
    console.log('获取设备列表成功')// console.log(devices.value)
    console.log(devices.value)

    // 保存原始快照并清空 dirty 标志
    originalRows.value = devices.value.map(r => ({ ...r }))
    dirtyFlags.value   = Array(devices.value.length).fill(false)

    /* 关键：给本页所有设备拉取照片 */
    devices.value.forEach(r => {
      if (r.zcbh) fetchPhotos(r.zcbh) // 仅当 zcbh 存在时才请求
    })
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
  // 处理单位名称变化
  if (key === 'lydwm') {
    const selectedDept = departments.value.find(dept => dept.label === val);
    if (selectedDept) {
      devices.value[index].lydwh = selectedDept.value;
    }
  }

  // 处理设备名称变化
  if (key === 'zcmc') {
    const selectedDevice = filteredDevices.value.find(dev => dev.label === val);
    if (selectedDevice) {
      // 自动设置分类号
      devices.value[index].zcflh = selectedDevice.value;
    }
  }

  // 通用更新逻辑
  devices.value[index][key] = val;
  dirtyFlags.value[index] = JSON.stringify(devices.value[index]) !== JSON.stringify(originalRows.value[index]);
}




const saveEdit = (index, key) => {
  // 检查是否为limit权限且值为空
  if (permissionMapping.value[key] === 'limit' && String(devices.value[index][key]).trim() === '') {
    ElMessage.warning(`"${fieldMapping[key] || key}" 字段不能为空`)
    // 恢复原值
    devices.value[index][key] = originalRows.value[index][key]
  }
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

    // 使用 zcbh 替换 rowIndex
    list.push({
      rowIndex: idx+1,
      user:localStorage.getItem('username'),
      zcbh: row.zcbh,// 设备编号作为唯一标识
      changes: changed
    })
  })
  return list
}


/* -------- 提交 & 放弃 -------- */
const handleSubmit = () => {
  showSubmitModal.value = true
}
const confirmSubmit = async () => {
  try {
    // 检查limit权限字段是否为空
    const emptyLimitFields = []
    devices.value.forEach((row, idx) => {
      if (!dirtyFlags.value[idx]) return

      Object.keys(row).forEach(k => {
        if (
          permissionMapping.value[k] === 'limit' &&
          row[k] !== originalRows.value[idx][k] &&
          String(row[k]).trim() === ''
        ) {
          emptyLimitFields.push(fieldMapping[k] || k)
        }
      })
    })

    if (emptyLimitFields.length > 0) {
      ElMessage.error(`以下限制修改字段不能为空: ${emptyLimitFields.join(', ')}`)
      return
    }

    console.log(collectChanges())
    await changeInfo(collectChanges())
    ElMessage.success('修改成功')
    await fetchDevices()
  } catch (e) {
    ElMessage.error('修改失败：' + (e.response?.data?.message || e.message))
  } finally {
    showSubmitModal.value = false
  }
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

/* -------- 实物照片上传/预览 -------- */
/* 上传并刷新列表 */
/* 查看大图 */
const viewImage = (url) => window.open(url, '_blank')


/* -------- 照片弹窗逻辑 -------- */
const openPhotoModal = async (zcbh) => {
  photoModalZcbh.value = zcbh
  showPhotoModal.value = true
  await fetchPhotos(zcbh)// 重新拉取最新列表
  photoModalList.value = photoMap.value[zcbh] || []
}

const closePhotoModal = () => {
  showPhotoModal.value = false
  photoModalList.value = []
}

/* 电脑/手机上传触发 */
const triggerComputerUpload = () => {
  const el = document.querySelector('.photo-modal input[type=file]')
  el?.click()
}
/*const mobileUpload = () => {
  const el = document.querySelector('.photo-modal input[type=file]')
  if (!el) return
  el.setAttribute('capture', 'environment')
  el.click()
  el.removeAttribute('capture')
}*/

/* 上传文件后刷新 */
const uploadPhotoFiles = async (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  try {
    await Promise.all(files.map(f => uploadPhoto(photoModalZcbh.value, f)))
    await fetchPhotos(photoModalZcbh.value)
    photoModalList.value = photoMap.value[photoModalZcbh.value] || []
  } catch (err) {
    alert('上传失败：' + (err.response?.data || err.message))
  } finally {
    e.target.value = ''
  }
}

/* 删除单张后刷新 */
const deletePhotoItem = async (id) => {
  if (!confirm('确定删除这张照片？')) return
  try {
    await deletePhoto(photoModalZcbh.value, id)
    await fetchPhotos(photoModalZcbh.value)
    photoModalList.value = photoMap.value[photoModalZcbh.value] || []
  } catch (err) {
    alert('删除失败：' + (err.response?.data || err.message))
  }
}
/* -------- 二维码弹窗 -------- */
const showQRModal = ref(false)
const qrCodeUrl = ref('')

/* 生成上传二维码 */
// 修改二维码生成方法
const generateQRCode = async () => {
  try {
    // 生成一次性token


    // 构建带token的上传URL
    const uploadUrl = `${location.origin}/api/upload/${photoModalZcbh.value}`;

    return await QRCode.toDataURL(uploadUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch (err) {
    console.error('二维码生成失败:', err);
    return '';
  }
}


/* 手机上传触发 */

const mobileUpload = async () => {
  qrCodeUrl.value = await generateQRCode()
  if (!qrCodeUrl.value) {
    alert('二维码生成失败，请稍后重试')
    return
  }
  showQRModal.value = true
}
const handleQRError = () => {
  console.error('二维码生成失败，URL:', qrCodeUrl.value)
  alert('二维码生成失败，请检查网络连接')
}

// 在显示二维码后启动轮询
const pollInterval = setInterval(async () => {
  try {
    const { data } = await getPhotos(photoModalZcbh.value);  // 确保解构data
    if (data && data.length > photoModalList.value.length) {
      photoModalList.value = data;
      clearInterval(pollInterval);
    }
  } catch (error) {
    console.error('轮询获取照片失败:', error);
    clearInterval(pollInterval);  // 出错时也清除轮询
  }
}, 3000);


// 二维码关闭时清除
onBeforeUnmount(() => clearInterval(pollInterval));

function editRow(row) {
  router.push({ name: 'DeviceEdit', params: { zcbh: row.zcbh }, state: { row } })
}
function viewDetail(row) {
  // 显示详情页面或弹窗
  router.push({ name: 'DeviceDetail', params: { zcbh: row.zcbh }, state: { row } })
}

function viewHistory(row) {
  photoModalZcbh.value = row.zcbh
  showHistoryModal.value = true
  fetchHistory(row.zcbh)
}
const parseChangeField = (bdyy) => {
  if (!bdyy) return { field: '', old: '', new: '' }

  // 示例格式："金额: 8400 -> 9000"
  const match = bdyy.match(/([^:]+):\s*(.*?)\s*->\s*(.*)/)
  if (match) {
    return {
      field: match[1],
      old: match[2],
      new: match[3]
    }
  }
  return { field: '', old: '', new: '' }
}


// 初始化时拉取数据
onMounted(async () => {
  // 假设角色信息存储在本地存储中
  const role = localStorage.getItem('user_role') || 'user'
  try {
    const { data } = await getPermissions(role)
    permissionMapping.value = data || {}
    console.log('权限映射:')
    console.log(data)
  } catch (error) {
    console.error('获取权限失败:', error)
    permissionMapping.value = {} // 如果获取失败，设置为空对象
  }
  await fetchDevices()
  await fetchDepartments() // 新增：获取使用单位列表
  await fetchFilteredDevices()
})
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
        <th>操作</th>
        <th>实物照片</th>
        <th v-for="k in visibleFields" :key="k" >{{ fieldMapping[k] || k }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, idx) in devices" :key="row.id" >
        <td>
          <input
              type="checkbox"
              :checked="dirtyFlags[idx]"
              @change="toggleDirty(idx)"
          />
        </td>
        <td>{{ idx + 1 }}</td>
        <td>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">操作</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="editRow(row)">修改</el-dropdown-item>
                <el-dropdown-item @click="viewHistory(row)">查看修改历史</el-dropdown-item>

              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </td>

        <!-- 实物照片列 -->
        <!-- 实物照片列：只剩一个查看按钮 -->
        <td>
          <button @click="openPhotoModal(row.zcbh)">查看</button>
          <el-badge
            :value="photoMap[row.zcbh]?.length || 0"
            :hidden="!photoMap[row.zcbh]?.length"
            class="photo-icon-badge"
          >
            <el-icon class="photo-icon">
              <Picture />
            </el-icon>
          </el-badge>
        </td>



        <!-- 其余字段列 -->
        <!-- 其余字段列 -->
              <td v-for="k in visibleFields" :key="k" :class="{ 'text-right': k === 'je' }">

                <!-- --- 只读单元格 -- -->
                <template v-if="permissionMapping.value[k] === 'read'">
                  <span class="read-only-cell">{{ row[k] }}</span>
                </template>
                <template v-else-if="permissionMapping.value[k] === 'limit'&& k !== 'lydwm'&& k !== 'zcmc'">
                  <span
                    v-if="!editing[idx] || editing[idx] !== k"
                    @dblclick="editing[idx] = k"
                    class="editable-cell limit"
                  >{{ row[k] }}</span>
                  <input
                    v-else
                    type="text"
                    :value="row[k]"
                    @input="updateValue(idx, k, $event.target.value)"
                    @blur="saveEdit(idx, k)"
                    @keyup.enter="saveEdit(idx, k)"
                    class="editable-input"
                    :placeholder="`${fieldMapping[k] || k} (不能为空)`"
                  />
                </template>
                <!-- --- 限制使用单位 -- -->
                <template v-else-if="k === 'lydwm'&&permissionMapping.value[k] === 'limit'" >
                  <el-select
                      v-model="row.lydwm"
                  placeholder="请选择使用单位"
                  @change="(val) => updateValue(idx, 'lydwm', val)"
                  class="editable-select"
                  filterable
                  >
                  <el-option
                      v-for="dept in departments"
                      :key="dept.value"
                      :label="dept.label"
                      :value="dept.label"
                  />
                  </el-select>
                </template>

                <!-- 设备名称选择 -->
                <template v-else-if="k ==='zcmc' && permissionMapping.value[k] === 'limit'">
                  <el-select
                      v-model="row.zcmc"
                      placeholder="请选择设备"
                      @change="(val) => updateValue(idx, 'zcmc', val)"
                      class="editable-select"
                      filterable
                  >
                    <el-option
                        v-for="dev in filteredDevices"
                        :key="dev.value"
                        :label="dev.label"
                        :value="dev.label"
                    />
                  </el-select>
                </template>

          <!-- --- 可编辑单元格 -- -->
                <template v-else>
                  <span
                      v-if="!editing[idx] || editing[idx] !== k"
                      @dblclick="editing[idx] = k"
                      class="editable-cell"
                  >{{ row[k] }}
                    </span>
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
    <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
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

  <!-- 照片查看/上传弹窗 -->
  <div v-if="showPhotoModal" class="photo-modal-mask" @click.self="closePhotoModal">
    <div class="photo-modal">
      <h3>设备 {{ photoModalZcbh }} 的实物照片</h3>

      <!-- 上传区 -->
      <div class="upload-bar">
        <input
            type="file"
            multiple
            accept="image/*"
            style="display:none"
            ref="photoUploadInput"
            @change="uploadPhotoFiles"
        />
        <button @click="triggerComputerUpload">电脑上传</button>
        <button @click="mobileUpload">手机上传</button>
      </div>

      <!-- 缩略图网格 -->
      <div class="photo-grid">
        <div
            v-for="p in photoModalList"
            :key="p.id"
            class="photo-item"
        >
          <img
              :src="`http://localhost:8080${p.thumbUrl}`"
              :alt="`设备 ${photoModalZcbh} 的实物照片`"
              @click="viewImage(`http://localhost:8080${p.url}`)"
          />
          <span class="remove" @click="deletePhotoItem(p.id)">✕</span>
        </div>
        <div v-if="!photoModalList.length" class="empty">暂无照片</div>
      </div>

      <button class="close-btn" @click="closePhotoModal">关闭</button>
    </div>
  </div>
  <div v-if="showQRModal" class="qr-modal-mask" @click.self="showQRModal = false">
    <div class="qr-modal">
      <h3>扫码上传照片</h3>
      <img
          :src="qrCodeUrl"
          alt="手机上传二维码"
          style="width: 200px; height: 200px"
          @error="handleQRError"
      />
      <p>使用手机扫描二维码上传照片</p>
      <button class="close-btn" @click="showQRModal = false">关闭</button>
    </div>
  </div>
  <!-- 修改历史弹窗 -->
  <div v-if="showHistoryModal" class="modal-mask" @click.self="showHistoryModal = false">
    <div class="modal">
      <h3>设备 {{ photoModalZcbh }} 的修改历史</h3>

      <table class="modal-table">
        <thead>
          <tr>
            <th>变动时间</th>
            <th>字段</th>
            <th>旧值</th>
            <th>新值</th>
            <th>操作人</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in historyList" :key="idx">
            <td>{{ item.bdrq }}</td>
            <td>{{ parseChangeField(item.bdyy).field }}</td>
            <td>{{ parseChangeField(item.bdyy).old }}</td>
            <td>{{ parseChangeField(item.bdyy).new }}</td>
            <td>{{ item.sqr }}</td>
          </tr>
        </tbody>
      </table>

      <div class="modal-btns">
        <button @click="showHistoryModal = false">关闭</button>
      </div>
    </div>
  </div>

</template>


<style scoped>
.qr-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.qr-modal {
  background: #fff;
  padding: 20px;
  border-radius:6px;
  text-align: center;
}
.qr-modal p {
  margin: 15px 0;
}
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
  color: #01050e;
}

.editable-input {
  background-color: #e9f3fd;
  border: 1px solid #007bff;
  color: #e61d1d;
  outline: none;
}

/* 照片弹窗蒙层 */
.photo-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.photo-modal {
  background: #fff;
  padding: 20px;
  border-radius: 6px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}
.upload-bar {
  margin-bottom: 12px;
}
.upload-bar button {
  margin-right: 8px;
}


.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}
.photo-item {
  position: relative;
}
.photo-item img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
.photo-item .remove {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ff4d4f;
  color: #fff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  padding: 20px 0;
}
.close-btn {
  margin-top: 12px;
}

.read-only-cell {
  display: inline-block;
  min-width: 100%;
  background-color: #f4f4f4; /* 灰色背景 */
  color: #01050e; /* 灰色字体 */
  cursor: not-allowed; /* 禁止鼠标交互 */
  border: 1px solid #ccc; /* 边框颜色 */
  padding: 4px 8px;
  font-size: 14px;
}

.text-right {
  text-align: right;
}
.photo-icon-badge {
  margin-left: 8px;
}

.photo-icon {
  color: #409EFF;
  font-size: 18px;
  vertical-align: middle;
}

.el-badge__content.is-fixed {
  top: 5px;
  right: 5px;
}
.item.limit {
  border-left: 4px solid #e6a23c; /* 橙色边框表示限制修改 */
}
/* 修改选择框样式，允许文字选择 */
.editable-select {
  padding: 8px 12px;
  border: 1px solid #0f131b;
  border-radius: 4px;
  font-size: 14px;
  color: #000000;
  transition: border-color 0.2s;
  width: 200px;
  min-width: 100%;
  user-select: text;
  -webkit-user-select: text;
}

/* 允许选择框输入文字和选项文字 */
.editable-select :deep(.el-input__inner),
.editable-select :deep(.el-select-dropdown__item) {
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

/* 下拉菜单样式调整 */
.editable-select :deep(.el-select-dropdown) {
  user-select: text;
  -webkit-user-select: text;
}
</style>