<template>
  <div class="faq-manage">
    <n-h1>FAQ 管理</n-h1>

    <!-- 添加新 FAQ -->
    <n-card title="添加新 FAQ" style="margin-bottom: 16px">
      <n-form ref="formRef" :model="formData" label-placement="left" label-width="80">
        <n-grid :cols="2" :x-gap="16">
          <n-gi :span="2">
            <n-form-item label="问题" path="question">
              <n-input v-model:value="formData.question" placeholder="请输入常见问题" />
            </n-form-item>
          </n-gi>
          <n-gi :span="2">
            <n-form-item label="回答" path="answer">
              <n-input
                v-model:value="formData.answer"
                type="textarea"
                placeholder="请输入回答内容"
                :rows="3"
              />
            </n-form-item>
          </n-gi>
          <n-gi :span="2">
            <n-form-item label="分类" path="category">
              <n-input v-model:value="formData.category" placeholder="请输入分类（可选）" />
            </n-form-item>
          </n-gi>
          <n-gi :span="2">
            <n-space>
              <n-button type="primary" :loading="submitting" @click="handleAdd">
                添加
              </n-button>
              <n-button @click="resetForm">
                重置
              </n-button>
            </n-space>
          </n-gi>
        </n-grid>
      </n-form>
    </n-card>

    <!-- FAQ 列表 -->
    <n-card title="FAQ 列表">
      <n-spin :show="loading">
        <n-list bordered>
          <n-list-item v-for="item in faqs" :key="item.id">
            <n-thing>
              <template #header>
                <n-space align="center">
                  <n-text strong>{{ item.question }}</n-text>
                  <n-tag v-if="item.category" size="small" type="info">{{ item.category }}</n-tag>
                </n-space>
              </template>
              <template #description>
                {{ item.answer }}
              </template>
              <template #action>
                <n-space>
                  <n-button text type="primary" @click="handleEdit(item)">编辑</n-button>
                  <n-popconfirm @positive-click="handleDelete(item.id)">
                    <template #trigger>
                      <n-button text type="error">删除</n-button>
                    </template>
                    确定删除此 FAQ？
                  </n-popconfirm>
                </n-space>
              </template>
            </n-thing>
          </n-list-item>
          <n-list-item v-if="faqs.length === 0 && !loading">
            <n-empty description="暂无 FAQ" />
          </n-list-item>
        </n-list>
      </n-spin>
    </n-card>

    <!-- 编辑弹窗 -->
    <n-modal v-model:show="editModalOpen" title="编辑 FAQ" preset="dialog" positive-text="保存" negative-text="取消" @positive-click="handleUpdate">
      <n-form :model="editData" label-placement="left" label-width="80" style="margin-top: 16px">
        <n-form-item label="问题">
          <n-input v-model:value="editData.question" placeholder="请输入问题" />
        </n-form-item>
        <n-form-item label="回答">
          <n-input v-model:value="editData.answer" type="textarea" placeholder="请输入回答" :rows="3" />
        </n-form-item>
        <n-form-item label="分类">
          <n-input v-model:value="editData.category" placeholder="请输入分类" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NH1,
  NInput,
  NList,
  NListItem,
  NModal,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag,
  NText,
  NThing,
  useMessage,
} from 'naive-ui'
import { getFAQs, type FAQ } from '../services/butlerService'

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const faqs = ref<FAQ[]>([])

// 添加表单
const formData = ref({
  question: '',
  answer: '',
  category: '',
})

// 编辑弹窗
const editModalOpen = ref(false)
const editData = ref({
  id: 0,
  question: '',
  answer: '',
  category: '',
})

const fetchFAQs = async () => {
  loading.value = true
  try {
    faqs.value = await getFAQs()
  } catch (e: any) {
    message.error('获取 FAQ 列表失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleAdd = async () => {
  if (!formData.value.question || !formData.value.answer) {
    message.warning('请填写问题和回答')
    return
  }
  submitting.value = true
  try {
    // MVP: 本地添加
    const newFaq: FAQ = {
      id: Date.now(),
      question: formData.value.question,
      answer: formData.value.answer,
      category: formData.value.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    faqs.value.unshift(newFaq)
    message.success('FAQ 添加成功')
    resetForm()
  } catch (e: any) {
    message.error('添加失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formData.value = { question: '', answer: '', category: '' }
}

const handleEdit = (item: FAQ) => {
  editData.value = {
    id: item.id,
    question: item.question,
    answer: item.answer,
    category: item.category,
  }
  editModalOpen.value = true
}

const handleUpdate = async () => {
  if (!editData.value.question || !editData.value.answer) {
    message.warning('请填写问题和回答')
    return false
  }
  try {
    // MVP: 本地更新
    const index = faqs.value.findIndex((f) => f.id === editData.value.id)
    if (index !== -1) {
      faqs.value[index] = {
        ...faqs.value[index],
        question: editData.value.question,
        answer: editData.value.answer,
        category: editData.value.category,
        updatedAt: new Date().toISOString(),
      }
    }
    message.success('FAQ 更新成功')
    return true
  } catch (e: any) {
    message.error('更新失败')
    return false
  }
}

const handleDelete = async (id: number) => {
  try {
    // MVP: 本地删除
    faqs.value = faqs.value.filter((f) => f.id !== id)
    message.success('FAQ 已删除')
  } catch (e: any) {
    message.error('删除失败')
  }
}

onMounted(fetchFAQs)
</script>
