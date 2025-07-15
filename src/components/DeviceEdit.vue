<template>
  <div class="edit-page">
    <h2>设备编号: {{ origin.zcbh }}</h2>

    <div class="two-col-list">
      <div v-for="k in displayFields" :key="k" class="item-row">
        <div class="field-name">{{ fieldMap[k] || k }}</div>
        <div class="field-value">
          <template v-if="permissionMap[k] === 'write' || permissionMap[k] === 'limit'">
            <span
              v-if="!editing[k]"
              @dblclick="editing[k] = true"
              class="editable-box"
              :class="{ 'limit-field': permissionMap[k] === 'limit' }"
            >
              {{ form[k] }}
            </span>
            <input
              v-else
              v-model="form[k]"
              @blur="saveEdit(k)"
              @keyup.enter="saveEdit(k)"
              class="input-box"
              :class="{ 'limit-input': permissionMap[k] === 'limit' }"
              :placeholder="permissionMap[k] === 'limit' ? `${fieldMap[k] || k} (不能为空)` : ''"
            />
          </template>

          <span v-else class="readonly-box">
            {{ origin[k] }}
          </span>
        </div>
      </div>
    </div>

    <el-divider>实物照片上传</el-divider>
    <div class="photo-button">
      <el-badge
        :value="photoModalList.length || 0"
        :hidden="!photoModalList.length"
        class="photo-icon-badge"
      >
        <el-icon class="photo-icon"><Picture /></el-icon>
      </el-badge>
      <el-button @click="openPhotoModal(route.params.zcbh)" type="primary">
        上传实物图片
      </el-button>
    </div>

    <el-button type="primary" @click="submit">保存修改</el-button>
    <el-button @click="cancelChanges">放弃修改</el-button>
    <el-button @click="$router.back()">返回</el-button>
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
        <div v-for="p in photoModalList" :key="p.id" class="photo-item">
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElIcon } from 'element-plus';
import {changeInfoSingle, getPermissions, getDeviceById, uploadPhoto, getPhotos, deletePhoto} from '@/api';
import { Picture } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const origin = ref({});
const form = ref({});
const editing = ref({});
const permissionMap = ref({});

/* -------- 照片弹窗 -------- */
const showPhotoModal = ref(false);   // 弹窗开关
const photoModalZcbh = ref('');      // 当前弹窗所属设备编号
const photoModalList = ref([]);      // 当前弹窗内的照片数组

/* -------- 实物照片 -------- */
const photoMap = ref({}) // { zcbh: [{id, thumbUrl, url}, ...] }

const fieldMap = {
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
};

const updateValue = (key, val) => {
  form.value[key] = val;
};

const saveEdit = (key) => {
  if (permissionMap.value[key] === 'limit' && String(form.value[key]).trim() === '') {
    ElMessage.warning(`"${fieldMap[key] || key}" 字段不能为空`);
    form.value[key] = origin.value[key];
  }
  editing.value[key] = false;
};

/* 电脑/手机上传触发 */
const triggerComputerUpload = () => {
  const el = document.querySelector('.photo-modal input[type=file]')
  el?.click()
}
/* 查看大图 */
const viewImage = (url) => window.open(url, '_blank')


onMounted(async () => {
  const code = route.params.zcbh;
  const { data: dev } = await getDeviceById(code);
  origin.value = dev;
  form.value = { ...dev };

  const role = localStorage.getItem('user_role') || 'user';
  const { data: perm } = await getPermissions(role);
  permissionMap.value = perm || {};

  // 初始化 photoModalList
  const { data: photos } = await getPhotos(code);
  photoModalList.value = photos;
});

/* 手机上传触发 */

const mobileUpload = async () => {
  qrCodeUrl.value = await generateQRCode()
  if (!qrCodeUrl.value) {
    alert('二维码生成失败，请稍后重试')
    return
  }
  showQRModal.value = true
}
const displayFields = computed(() =>
  Object.keys(fieldMap).filter(k => origin.value[k] !== undefined && origin.value[k] !== null)
);

async function submit() {
  const changes = {};
  const emptyLimitFields = [];

  displayFields.value.forEach(k => {
    if (
      permissionMap.value[k] === 'limit' &&
      form.value[k] !== origin.value[k] &&
      String(form.value[k]).trim() === ''
    ) {
      emptyLimitFields.push(fieldMap[k] || k);
    }
  });

  if (emptyLimitFields.length > 0) {
    ElMessage.error(`以下限制修改字段不能为空: ${emptyLimitFields.join(', ')}`);
    return;
  }

  displayFields.value.forEach(k => {
    if (form.value[k] !== origin.value[k]) {
      changes[k] = { old: origin.value[k], new: form.value[k] };
    }
  });

  if (Object.keys(changes).length === 0) {
    ElMessage.info('No changes');
    return;
  }

  const confirmMessage = Object.keys(changes).map(k => `
    <div>
      <strong>${fieldMap[k] || k}:</strong>
      <p>Old: ${changes[k].old}</p>
      <p>New: ${changes[k].new}</p>
    </div>
  `).join('');

  ElMessageBox.confirm(confirmMessage, '确认修改', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info',
    dangerouslyUseHTMLString: true,
  }).then(async () => {
    await changeInfoSingle([{ zcbh: origin.value.zcbh, changes }]);
    ElMessage.success('已保存');
    router.back();
  }).catch(() => {
    ElMessage.info('修改取消');
  });
}

/* 获取某设备的照片列表（含缩略图） */
const fetchPhotos = async (zcbh) => {
  try {
    const { data } = await getPhotos(zcbh)
    photoMap.value[zcbh] = data || []
  } catch {
    photoMap.value[zcbh] = []
    console.error(`获取设备 ${zcbh} 照片列表失败`)
  }
}

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
const openPhotoModal = async (zcbh) => {
  photoModalZcbh.value = zcbh;
  showPhotoModal.value = true;
  const { data: photos } = await getPhotos(zcbh);
  photoModalList.value = photos;
};

const closePhotoModal = async () => {
  showPhotoModal.value = false;
  // 初始化 photoModalList
  const {data: photos} = await getPhotos(code);
  photoModalList.value = photos;
};

function cancelChanges() {
  ElMessageBox.confirm('你是否确认放弃修改', '修改已放弃', {
    confirmButtonText: '放弃',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    form.value = { ...origin.value };
    ElMessage.info('已放弃修改');
  }).catch(() => {
    ElMessage.info('修改未放弃');
  });
}
</script>

<style scoped>
/* limit权限字段特殊样式 */
.limit-field {
  border-left: 3px solid #e6a23c;
  padding-left: 5px;
}

.limit-input {
  border-left: 3px solid #e6a23c;
}

.limit-input:focus {
  border-color: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230,162,60,0.1);
}

.edit-page { padding: 20px; width: 100%; margin: 0 auto; }
.two-col-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.item-row {
  display: flex;
  align-items: center;
}
.field-name {
  width: 140px;
  font-weight: bold;
}
.field-value {
  flex: none;
  width: 220px;
}
.editable-box,
.readonly-box,
.input-box {
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
  display: inline-block;
  width: 220px;               /* 统一宽度 */
}
.readonly-box {
  background: #f5f5f5;
  color: #909399;
  cursor: not-allowed;
  user-select: none;
}
.input-box {
  background: #fff;
}
.photo-button {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0;
}

.photo-icon-badge {
  margin-right: 8px;
}

.photo-icon {
  color: #409EFF;
  font-size: 18px;
  vertical-align: middle;
}

.el-badge__content.is-fixed {
  top: 5px;
  right: -10px; /* 调整数字的位置 */
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  padding: 0 6px;
  line-height: 18px;
  height: 18px;
}

.photo-thumb {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
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
</style>
