<template>
  <div class="create-post">
    <n-h1>发布新帖</n-h1>
    <n-card>
      <n-form>
        <n-form-item label="标题">
          <n-input v-model:value="form.title" placeholder="请输入帖子标题" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="form.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="内容">
          <n-input v-model:value="form.content" type="textarea" placeholder="请输入帖子内容" :rows="10" />
        </n-form-item>
        <n-space>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">发布</n-button>
          <n-button @click="$router.back()">取消</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, NSelect, NSpace, NH1 } from 'naive-ui'
import { createPost } from '../api'

const router = useRouter()
const message = useMessage()
const submitting = ref(false)

const form = reactive({
  title: '',
  category: null as string | null,
  content: '',
})

const categoryOptions = [
  { label: '创业心得', value: 'experience' },
  { label: '项目展示', value: 'project' },
  { label: '寻求合作', value: 'cooperation' },
  { label: '问题求助', value: 'help' },
]

async function handleSubmit() {
  if (!form.title.trim()) {
    message.warning('请输入帖子标题')
    return
  }
  if (!form.content.trim()) {
    message.warning('请输入帖子内容')
    return
  }

  submitting.value = true
  try {
    const newPost = await createPost({
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category || undefined,
    })
    message.success('发布成功')
    router.push(`/posts/${newPost.id}`)
  } catch (e: any) {
    message.error(e.message || '发布失败')
  } finally {
    submitting.value = false
  }
}
</script>
