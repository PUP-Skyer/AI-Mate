<template>
  <div class="post-detail">
    <n-button text @click="$router.back()">返回列表</n-button>
    <n-spin :show="loading">
      <template v-if="post">
        <n-h1>{{ post.title }}</n-h1>
        <n-card>
          <n-space align="center" size="small" style="margin-bottom: 12px">
            <n-tag :type="categoryTagType(post.category)">
              {{ categoryLabel(post.category) }}
            </n-tag>
            <n-text depth="3">{{ post.authorName }}</n-text>
            <n-text depth="3">{{ formatDate(post.createdAt) }}</n-text>
          </n-space>
          <n-p style="white-space: pre-wrap; line-height: 1.8">{{ post.content }}</n-p>
          <n-divider />

          <!-- 点赞 -->
          <n-space align="center" style="margin-bottom: 16px">
            <n-button
              :type="post.liked ? 'error' : 'default'"
              secondary
              @click="handleLike"
              :loading="liking"
            >
              {{ post.liked ? '已赞' : '点赞' }} ({{ post.likeCount }})
            </n-button>
          </n-space>

          <n-divider />

          <!-- 评论区 -->
          <n-h3>评论区 ({{ post.comments?.length || 0 }})</n-h3>
          <n-list bordered>
            <n-list-item v-for="comment in post.comments" :key="comment.id">
              <n-thing :title="comment.authorName" :description="comment.content">
                <template #header-extra>
                  <n-text depth="3" style="font-size: 12px">
                    {{ formatDate(comment.createdAt) }}
                  </n-text>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
          <n-empty v-if="!post.comments?.length" description="暂无评论" style="margin: 16px 0" />

          <!-- 发表评论 -->
          <n-space style="margin-top: 16px" align="end">
            <n-input
              v-model:value="commentContent"
              type="textarea"
              placeholder="写下你的评论..."
              :rows="3"
              style="flex: 1"
            />
            <n-button
              type="primary"
              :loading="submittingComment"
              :disabled="!commentContent.trim()"
              @click="handleAddComment"
            >
              发送
            </n-button>
          </n-space>
        </n-card>
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton, NCard, NH1, NH3, NP, NDivider, NList, NListItem,
  NThing, NSpace, NTag, NText, NEmpty, NSpin, NInput,
} from 'naive-ui'
import { getPostDetail, addComment, likePost, type PostDetail } from '../api'

const route = useRoute()
const postId = Number(route.params.id)

const post = ref<PostDetail | null>(null)
const loading = ref(false)
const liking = ref(false)
const submittingComment = ref(false)
const commentContent = ref('')

const categoryOptions = [
  { label: '创业心得', value: 'experience' },
  { label: '项目展示', value: 'project' },
  { label: '寻求合作', value: 'cooperation' },
  { label: '问题求助', value: 'help' },
]

function categoryLabel(cat: string): string {
  return categoryOptions.find((c) => c.value === cat)?.label || cat
}

function categoryTagType(cat: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    experience: 'success',
    project: 'info',
    cooperation: 'warning',
    help: 'error',
  }
  return map[cat] || 'default'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function fetchPost() {
  loading.value = true
  try {
    post.value = await getPostDetail(postId)
  } catch (e: any) {
    console.error('加载帖子详情失败:', e.message)
  } finally {
    loading.value = false
  }
}

async function handleLike() {
  if (liking.value) return
  liking.value = true
  try {
    await likePost(postId)
    if (post.value) {
      post.value.liked = !post.value.liked
      post.value.likeCount += post.value.liked ? 1 : -1
    }
  } catch (e: any) {
    console.error('点赞失败:', e.message)
  } finally {
    liking.value = false
  }
}

async function handleAddComment() {
  const content = commentContent.value.trim()
  if (!content || submittingComment.value) return
  submittingComment.value = true
  try {
    const newComment = await addComment(postId, content)
    if (post.value) {
      post.value.comments.push(newComment)
      post.value.commentCount = (post.value.commentCount || 0) + 1
    }
    commentContent.value = ''
  } catch (e: any) {
    console.error('评论失败:', e.message)
  } finally {
    submittingComment.value = false
  }
}

onMounted(() => {
  fetchPost()
})
</script>
