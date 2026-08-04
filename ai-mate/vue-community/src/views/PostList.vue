<template>
  <div class="post-list">
    <n-h1>创业社区 - 帖子列表</n-h1>
    <n-space vertical>
      <n-space>
        <n-input
          v-model:value="keyword"
          placeholder="搜索帖子..."
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        />
        <n-button type="primary" @click="$router.push('/create-post')">发布新帖</n-button>
      </n-space>

      <!-- 分类筛选 -->
      <n-space>
        <n-tag
          v-for="cat in categoryOptions"
          :key="cat.value"
          :type="activeCategory === cat.value ? 'primary' : 'default'"
          :bordered="activeCategory !== cat.value"
          style="cursor: pointer"
          @click="toggleCategory(cat.value)"
        >
          {{ cat.label }}
        </n-tag>
      </n-space>

      <!-- 帖子列表 -->
      <n-spin :show="loading">
        <n-list bordered>
          <n-list-item v-for="post in filteredPosts" :key="post.id">
            <n-thing :title="post.title" :description="post.content?.slice(0, 100) + '...'">
              <template #header-extra>
                <n-space align="center" size="small">
                  <n-tag size="small" :type="categoryTagType(post.category)">
                    {{ categoryLabel(post.category) }}
                  </n-tag>
                  <n-text depth="3" style="font-size: 12px">{{ post.authorName }}</n-text>
                </n-space>
              </template>
              <template #footer>
                <n-space size="large">
                  <n-text depth="3" style="font-size: 12px">
                    {{ post.likeCount || 0 }} 赞
                  </n-text>
                  <n-text depth="3" style="font-size: 12px">
                    {{ post.commentCount || 0 }} 评论
                  </n-text>
                  <n-text depth="3" style="font-size: 12px">
                    {{ formatDate(post.createdAt) }}
                  </n-text>
                </n-space>
              </template>
              <template #action>
                <n-button text type="primary" @click="$router.push(`/posts/${post.id}`)">
                  查看详情
                </n-button>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
        <n-empty v-if="!loading && filteredPosts.length === 0" description="暂无帖子" />
      </n-spin>

      <!-- 加载更多 -->
      <n-space justify="center" v-if="hasMore">
        <n-button :loading="loadingMore" @click="loadMore">加载更多</n-button>
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NInput, NList, NListItem, NThing, NSpace, NH1,
  NTag, NText, NEmpty, NSpin,
} from 'naive-ui'
import { getPosts, type PostItem } from '../api'

const keyword = ref('')
const activeCategory = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const posts = ref<PostItem[]>([])
const page = ref(0)
const totalPages = ref(0)

const categoryOptions = [
  { label: '创业心得', value: 'experience' },
  { label: '项目展示', value: 'project' },
  { label: '寻求合作', value: 'cooperation' },
  { label: '问题求助', value: 'help' },
]

const filteredPosts = computed(() => {
  if (!keyword.value.trim()) return posts.value
  const kw = keyword.value.trim().toLowerCase()
  return posts.value.filter(
    (p) =>
      p.title?.toLowerCase().includes(kw) ||
      p.content?.toLowerCase().includes(kw)
  )
})

const hasMore = computed(() => page.value < totalPages.value - 1)

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

async function fetchPosts(reset = true) {
  if (reset) {
    loading.value = true
    page.value = 0
    posts.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const result = await getPosts({
      page: page.value,
      size: 10,
      category: activeCategory.value || undefined,
    })
    if (reset) {
      posts.value = result.content || []
    } else {
      posts.value.push(...(result.content || []))
    }
    totalPages.value = result.totalPages || 0
  } catch (e: any) {
    console.error('加载帖子失败:', e.message)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  page.value++
  fetchPosts(false)
}

function toggleCategory(cat: string) {
  activeCategory.value = activeCategory.value === cat ? null : cat
  fetchPosts(true)
}

function handleSearch() {
  // 前端过滤，不需要重新请求
}

onMounted(() => {
  fetchPosts()
})
</script>
