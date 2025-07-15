<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { getRoles,getPermissions,savePermission } from '@/api'
import { Check, Lock, Edit, Rank, FolderDelete } from '@element-plus/icons-vue'
import { CircleCheck, CircleClose, EditPen } from '@element-plus/icons-vue'


const currentRole = ref()
const roles = ref([])

async function loadRoles() {
  const { data } = await getRoles()
  roles.value = data || []
}


// 所有字段
const allFields = [
  { id: 'lydwh', label: '使用单位号' },
  { id: 'lydwm', label: '使用单位' },
  { id: 'zcbh', label: '设备编号' },
  { id: 'zcflh', label: '分类号' },
  { id: 'zcmc', label: '设备名称' },
  { id: 'ppxh', label: '品牌型号' },
  { id: 'gg', label: '规格' },
  { id: 'je', label: '金额' },
  { id: 'jldw', label: '计量单位' },
  { id: 'cj', label: '厂家' },
  { id: 'ggrq', label: '购置日期' },
  { id: 'xz', label: '现状' },
  { id: 'jfkm', label: '经费科目' },
  { id: 'cfdbh', label: '存放地编号' },
  { id: 'cfdmc', label: '存放地名称' },
  { id: 'syrbh', label: '使用人编号' },
  { id: 'syr', label: '使用人' },
  { id: 'jsr', label: '经手人' },
  { id: 'ywdh', label: '业务单号' },
  { id: 'shzt', label: '审核状态' },
  { id: 'jzr', label: '记帐人' },
  { id: 'rzrq', label: '入账时间' },
  { id: 'bz', label: '备注' },
  { id: 'zfby1', label: '字符备用1' },
  { id: 'zfby2', label: '字符备用2' },
  { id: 'szby1', label: '数字备用1' },
  { id: 'szby2', label: '数字备用2' },
  { id: 'rqby1', label: '日期备用1' },
  { id: 'srr', label: '输入人' },
  { id: 'srrq', label: '输入日期' },
]

const readFields = ref([])
const limitFields = ref([]) // 新增限制修改字段
const writeFields = ref([])

// 加载角色权限
async function loadRolePermissions() {
  const { data } = await getPermissions(currentRole.value)
  const permissionMap = data || {}
  readFields.value = []
  limitFields.value = [] // 初始化限制修改字段
  writeFields.value = []
  allFields.forEach(f => {
    if (permissionMap[f.id] === 'write') {
      writeFields.value.push(f)
    } else if (permissionMap[f.id] === 'limit') {
      limitFields.value.push(f)
    } else {
      readFields.value.push(f)
    }
  })
}



// 保存权限
async function savePermissions() {
  if (!currentRole.value) {
    ElMessage.warning('请先选择角色')
    return
  }

  const permissionMap = {}
  readFields.value.forEach(f => (permissionMap[f.id] = 'read'))
  limitFields.value.forEach(f => (permissionMap[f.id] = 'limit')) // 保存限制修改权限
  writeFields.value.forEach(f => (permissionMap[f.id] = 'write'))

  try {
    const { data } = await savePermission(currentRole.value, permissionMap)
    if (data.code === 200) {
      ElMessage.success(data.message || '保存成功')
    } else {
      ElMessage.error(data.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败：' + (e.response?.data?.message || e.message))
  }
}
onMounted(() => {
  loadRoles()        // 先拉角色
  loadRolePermissions() // 再拉权限
})
</script>

<template>
  <div class="permission-page">
    <!-- 顶部选择角色 -->
    <div class="header">
      <el-card shadow="never">
        <div class="flex items-center">
          <el-text class="mr-3">选择角色：</el-text>
          <el-select
            v-model="currentRole"
            @change="loadRolePermissions"
            placeholder="请选择角色"
            style="width: 300px"
          >
            <el-option
              v-for="r in roles"
              :key="r"
              :label="r"
              :value="r"
            />
          </el-select>
          <el-button
            type="primary"
            @click="savePermissions"
            class="ml-5"
            :disabled="!currentRole"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            保存权限设置
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 拖拽区域 -->
    <div class="drag-container mt-5">
      <!-- 左侧：只读权限 -->
      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold text-gray-700">
              <el-icon class="mr-1"><CircleClose /></el-icon>
              只读权限
            </span>
            <el-tag type="info">{{ readFields.length }}项</el-tag>
          </div>
        </template>
        <draggable
            v-model="readFields"
            group="fields"
            item-key="id"
            class="list"
            animation="200"
        >
          <template #item="{ element }">
            <el-card shadow="hover" class="item read mb-2">
              <div class="flex justify-between items-center">
                <span>{{ element.label }}</span>
                <el-icon class="drag-handle"><Rank /></el-icon>
              </div>
            </el-card>
          </template>
        </draggable>
      </el-card>

      <!-- 中间：限制修改权限 -->
      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold text-gray-700">
              <el-icon class="mr-1"><EditPen /></el-icon>
              限制修改权限
            </span>
            <el-tag type="warning">{{ limitFields.length }}项</el-tag>
          </div>
        </template>
        <draggable
            v-model="limitFields"
            group="fields"
            item-key="id"
            class="list"
            animation="200"
        >
          <template #item="{ element }">
            <el-card shadow="hover" class="item limit mb-2">
              <div class="flex justify-between items-center">
                <span>{{ element.label }}</span>
                <el-icon class="drag-handle"><Rank /></el-icon>
              </div>
            </el-card>
          </template>
        </draggable>
      </el-card>

      <!-- 右侧：完全修改权限 -->
      <el-card shadow="hover" class="panel">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold text-gray-700">
              <el-icon class="mr-1"><CircleCheck /></el-icon>
              完全修改权限
            </span>
            <el-tag type="success">{{ writeFields.length }}项</el-tag>
          </div>
        </template>
        <draggable
            v-model="writeFields"
            group="fields"
            item-key="id"
            class="list"
            animation="200"
        >
          <template #item="{ element }">
            <el-card shadow="hover" class="item write mb-2">
              <div class="flex justify-between items-center">
                <span>{{ element.label }}</span>
                <el-icon class="drag-handle"><Rank /></el-icon>
              </div>
            </el-card>
          </template>
        </draggable>
      </el-card>
    </div>
  </div>
</template>


<style scoped>
.permission-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.header {
  margin-bottom: 20px;
}

.drag-container {
  display: flex;
  gap: 20px;
}

.panel {
  flex: 1;
  min-width: 0;
}

.list {
  min-height: 500px;
  padding: 10px;
}

.item {
  cursor: grab;
  transition: all 0.3s;
}

.item:hover {
  transform: translateY(-2px);
}

.item.read {
  border-left: 4px solid #909399;
}

.item.write {
  border-left: 4px solid #67c23a;
}

.drag-handle {
  cursor: grab;
  color: #c0c4cc;
}

.drag-handle:hover {
  color: #909399;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  margin-top: 10px;
}

.empty i {
  font-size: 30px;
  margin-bottom: 10px;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .drag-container {
    flex-direction: column;
  }

  .panel {
    width: 100%;
  }
}
</style>
