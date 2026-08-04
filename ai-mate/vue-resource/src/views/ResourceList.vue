<template>
  <div class="resource-list">
    <n-h1>创业资源中心</n-h1>
    <n-space vertical>
      <n-space>
        <n-input
          v-model:value="keyword"
          placeholder="搜索资源..."
          clearable
          style="width: 300px"
        />
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

      <!-- 资源卡片列表 -->
      <n-spin :show="loading">
        <n-grid :cols="3" :x-gap="16" :y-gap="16">
          <n-gi v-for="tpl in filteredTemplates" :key="tpl.id">
            <n-card :title="tpl.name" hoverable>
              <n-p>{{ tpl.description }}</n-p>
              <template #action>
                <n-space>
                  <n-tag size="small" :type="categoryTagType(tpl.category)">
                    {{ categoryLabel(tpl.category) }}
                  </n-tag>
                  <n-button text type="primary" @click="$router.push(`/resources/${tpl.id}`)">
                    查看详情
                  </n-button>
                </n-space>
              </template>
            </n-card>
          </n-gi>
        </n-grid>
        <n-empty v-if="!loading && filteredTemplates.length === 0" description="暂无资源" />
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NCard, NGrid, NGi, NInput, NP, NSpace, NH1,
  NTag, NEmpty, NSpin,
} from 'naive-ui'
import { getTemplates, type TemplateItem } from '../api'

const keyword = ref('')
const activeCategory = ref<string | null>(null)
const loading = ref(false)
const templates = ref<TemplateItem[]>([])

const categoryOptions = [
  { label: '商业计划', value: 'business-plan' },
  { label: '市场分析', value: 'market-analysis' },
  { label: '融资材料', value: 'fundraising' },
  { label: '产品文档', value: 'product-doc' },
  { label: '运营模板', value: 'operation' },
]

const filteredTemplates = computed(() => {
  if (!keyword.value.trim()) return templates.value
  const kw = keyword.value.trim().toLowerCase()
  return templates.value.filter(
    (t) =>
      t.name?.toLowerCase().includes(kw) ||
      t.description?.toLowerCase().includes(kw)
  )
})

function categoryLabel(cat: string): string {
  return categoryOptions.find((c) => c.value === cat)?.label || cat
}

function categoryTagType(cat: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    'business-plan': 'success',
    'market-analysis': 'info',
    'fundraising': 'warning',
    'product-doc': 'error',
    'operation': 'default',
  }
  return map[cat] || 'default'
}

async function fetchTemplates() {
  loading.value = true
  try {
    templates.value = await getTemplates({
      category: activeCategory.value || undefined,
    })
  } catch (e: any) {
    console.error('加载资源失败:', e.message)
  } finally {
    loading.value = false
  }
}

function toggleCategory(cat: string) {
  activeCategory.value = activeCategory.value === cat ? null : cat
  fetchTemplates()
}

onMounted(() => {
  fetchTemplates()
})
</script>
