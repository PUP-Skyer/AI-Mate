<template>
  <div class="scout-view">
    <n-layout has-sider class="scout-layout">
      <n-layout-sider
        bordered
        :width="220"
        :collapsed-width="0"
        :collapsed="sidebarCollapsed"
        collapse-mode="width"
        show-trigger
        @collapse="sidebarCollapsed = true"
        @expand="sidebarCollapsed = false"
        class="scout-sider"
      >
        <div class="sider-content">
          <div class="role-info">
            <n-avatar size="large" :style="{ backgroundColor: '#18a058' }">
              <n-icon size="32">
                <compass-outline />
              </n-icon>
            </n-avatar>
            <h3>探路者AI</h3>
            <p>资源对接专家</p>
          </div>

          <n-divider />

          <div class="function-menu">
            <n-text type="secondary" class="menu-title">功能菜单</n-text>
            <n-space vertical size="small">
              <n-button
                v-for="item in functionList"
                :key="item.key"
                block
                :type="activeFunction === item.key ? 'primary' : 'default'"
                @click="switchFunction(item.key)"
              >
                <template #icon>
                  <n-icon :component="item.icon" />
                </template>
                {{ item.label }}
              </n-button>
            </n-space>
          </div>

          <n-divider />

          <div class="conversation-history">
            <div class="history-header">
              <n-text type="secondary">对话历史</n-text>
              <n-button text size="small" @click="createNewConversation">
                <template #icon>
                  <n-icon><add-outline /></n-icon>
                </template>
              </n-button>
            </div>
            <n-list hoverable clickable size="small">
              <n-list-item
                v-for="conv in conversations"
                :key="conv.id"
                @click="switchConversation(conv.id)"
                :style="{ backgroundColor: activeConversationId === conv.id ? '#e8f5e9' : '' }"
              >
                <n-ellipsis style="font-size: 12px;">
                  {{ conv.title || '新对话' }}
                </n-ellipsis>
              </n-list-item>
            </n-list>
          </div>
        </div>
      </n-layout-sider>

      <n-layout class="main-area">
        <n-layout-header bordered class="toolbar">
          <n-space justify="space-between" align="center">
            <n-space align="center">
              <n-button quaternary @click="sidebarCollapsed = !sidebarCollapsed">
                <template #icon>
                  <n-icon><menu-outline /></n-icon>
                </template>
              </n-button>
              <n-text strong>{{ currentFunctionLabel }}</n-text>
            </n-space>
            <n-space>
              <n-button quaternary @click="clearMessages" :disabled="messages.length === 0">
                <template #icon>
                  <n-icon><trash-outline /></n-icon>
                </template>
                清空
              </n-button>
              <n-button type="primary" @click="createNewConversation">
                <template #icon>
                  <n-icon><add-outline /></n-icon>
                </template>
                新对话
              </n-button>
            </n-space>
          </n-space>
        </n-layout-header>

        <div class="filter-bar">
          <n-space :size="16">
            <n-space vertical size="small">
              <n-text depth="3" style="font-size: 12px;">目标地域</n-text>
              <n-select
                v-model:value="selectedRegion"
                :options="regionOptions"
                placeholder="选择地域"
                style="width: 140px;"
                @update:value="handleFilterChange"
              />
            </n-space>
            <n-space vertical size="small">
              <n-text depth="3" style="font-size: 12px;">投资金额</n-text>
              <n-space :size="8">
                <n-input-number
                  v-model:value="investmentMin"
                  :min="0"
                  :step="100"
                  placeholder="最小"
                  style="width: 100px;"
                  @update:value="handleFilterChange"
                />
                <n-text depth="3">-</n-text>
                <n-input-number
                  v-model:value="investmentMax"
                  :min="0"
                  :step="100"
                  placeholder="最大"
                  style="width: 100px;"
                  @update:value="handleFilterChange"
                />
                <n-text depth="3">万元</n-text>
              </n-space>
            </n-space>
          </n-space>
        </div>

        <n-layout-content class="content-area">
          <div v-if="activeFunction === 'supplier'" class="chat-section">
            <div class="messages-container" ref="messagesContainer">
              <div v-if="messages.length === 0" class="empty-state">
                <n-empty :description="`开始与探路者AI对话`">
                  <template #icon>
                    <n-icon size="64" color="#18a058">
                      <compass-outline />
                    </n-icon>
                  </template>
                  <template #extra>
                    <n-text depth="3">{{ currentFunctionDescription }}</n-text>
                  </template>
                </n-empty>
              </div>
              <div v-else class="message-list">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  :class="['message-item', msg.role]"
                >
                  <n-avatar
                    v-if="msg.role === 'assistant'"
                    :style="{ backgroundColor: '#18a058' }"
                    class="message-avatar"
                  >
                    <n-icon><compass-outline /></n-icon>
                  </n-avatar>
                  <div class="message-content">
                    <div class="message-bubble" :class="msg.role">
                      <n-spin v-if="msg.loading" size="small" />
                      <n-text v-else>{{ msg.content }}</n-text>
                    </div>
                  </div>
                  <n-avatar
                    v-if="msg.role === 'user'"
                    :style="{ backgroundColor: '#87d068' }"
                    class="message-avatar"
                  >
                    <n-icon><person-outline /></n-icon>
                  </n-avatar>
                </div>
              </div>
            </div>
            <div class="input-area">
              <n-input-group>
                <n-input
                  v-model:value="inputValue"
                  placeholder="输入消息与探路者AI对话..."
                  @keydown="handleKeyDown"
                  :disabled="isGenerating"
                />
                <n-button
                  type="primary"
                  @click="handleSend"
                  :loading="isGenerating"
                  :disabled="!inputValue.trim()"
                >
                  <template #icon>
                    <n-icon><send-outline /></n-icon>
                  </template>
                  发送
                </n-button>
              </n-input-group>
            </div>
          </div>

          <div v-else-if="activeFunction === 'partner'" class="partner-section">
            <div class="partner-cards">
              <n-grid :cols="3" :x-gap="16" :y-gap="16">
                <n-gi v-for="partner in filteredPartners" :key="partner.id">
                  <n-card
                    hoverable
                    @click="showPartnerDetail(partner)"
                    class="partner-card"
                  >
                    <div class="partner-background" :style="{ backgroundImage: `url(${partner.image})` }">
                      <div class="partner-overlay">
                        <div class="partner-header">
                          <n-avatar size="large" :style="{ backgroundColor: partner.color }">
                            {{ partner.name.charAt(0) }}
                          </n-avatar>
                          <div class="partner-info">
                            <n-text strong style="color: #ffffff; font-family: 'Microsoft YaHei', '微软雅黑', sans-serif; text-shadow: 0 0 8px rgba(255,255,255,0.5);">{{ partner.name }}</n-text>
                            <n-text depth="1" style="font-size: 12px; color: rgba(255,255,255,0.9);">{{ partner.type }}</n-text>
                          </div>
                        </div>
                        <div class="partner-details">
                          <div class="detail-item">
                            <n-text depth="1" style="color: rgba(255,255,255,0.9);">投资领域：</n-text>
                            <n-text style="color: white;">{{ partner.domain }}</n-text>
                          </div>
                          <div class="detail-item">
                            <n-text depth="1" style="color: rgba(255,255,255,0.9);">投资金额：</n-text>
                            <n-text style="color: white;">{{ partner.investmentRange }}</n-text>
                          </div>
                          <div class="detail-item">
                            <n-text depth="1" style="color: rgba(255,255,255,0.9);">所在地域：</n-text>
                            <n-text style="color: white;">{{ partner.region }}</n-text>
                          </div>
                        </div>
                        <div class="partner-footer">
                          <n-button size="small" type="primary" @click.stop="showPartnerDetail(partner)">
                            查看详情
                          </n-button>
                        </div>
                      </div>
                    </div>
                  </n-card>
                </n-gi>
              </n-grid>
            </div>
          </div>

          <div v-else-if="activeFunction === 'market'" class="market-section">
            <div class="market-dashboard">
              <n-grid :cols="3" :x-gap="16" :y-gap="16">
                <n-gi>
                  <n-card title="投资趋势" class="chart-card">
                    <div ref="trendChartRef" style="height: 250px;"></div>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card title="行业分布" class="chart-card">
                    <div ref="industryChartRef" style="height: 250px;"></div>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card title="地域分布" class="chart-card">
                    <div ref="regionChartRef" style="height: 250px;"></div>
                  </n-card>
                </n-gi>
                <n-gi :span="3">
                  <n-card title="市场数据统计">
                    <n-grid :cols="4" :x-gap="16">
                      <n-gi>
                        <div class="stat-item">
                          <n-statistic label="总投资额">
                            <n-number-animation :from="0" :to="125680" />
                            <template #suffix>万元</template>
                          </n-statistic>
                        </div>
                      </n-gi>
                      <n-gi>
                        <div class="stat-item">
                          <n-statistic label="投资项目数">
                            <n-number-animation :from="0" :to="328" />
                            <template #suffix>个</template>
                          </n-statistic>
                        </div>
                      </n-gi>
                      <n-gi>
                        <div class="stat-item">
                          <n-statistic label="环比增长">
                            <n-number-animation :from="0" :to="15.8" :precision="1" />
                            <template #suffix>%</template>
                          </n-statistic>
                        </div>
                      </n-gi>
                      <n-gi>
                        <div class="stat-item">
                          <n-statistic label="活跃投资商">
                            <n-number-animation :from="0" :to="86" />
                            <template #suffix>家</template>
                          </n-statistic>
                        </div>
                      </n-gi>
                    </n-grid>
                  </n-card>
                </n-gi>
              </n-grid>
            </div>
          </div>

          <div v-else-if="activeFunction === 'industry'" class="chat-section">
            <div class="messages-container" ref="messagesContainer">
              <div v-if="messages.length === 0" class="empty-state">
                <n-empty :description="`开始与探路者AI对话`">
                  <template #icon>
                    <n-icon size="64" color="#18a058">
                      <compass-outline />
                    </n-icon>
                  </template>
                  <template #extra>
                    <n-text depth="3">{{ currentFunctionDescription }}</n-text>
                  </template>
                </n-empty>
              </div>
              <div v-else class="message-list">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  :class="['message-item', msg.role]"
                >
                  <n-avatar
                    v-if="msg.role === 'assistant'"
                    :style="{ backgroundColor: '#18a058' }"
                    class="message-avatar"
                  >
                    <n-icon><compass-outline /></n-icon>
                  </n-avatar>
                  <div class="message-content">
                    <div class="message-bubble" :class="msg.role">
                      <n-spin v-if="msg.loading" size="small" />
                      <n-text v-else>{{ msg.content }}</n-text>
                    </div>
                  </div>
                  <n-avatar
                    v-if="msg.role === 'user'"
                    :style="{ backgroundColor: '#87d068' }"
                    class="message-avatar"
                  >
                    <n-icon><person-outline /></n-icon>
                  </n-avatar>
                </div>
              </div>
            </div>
            <div class="input-area">
              <n-input-group>
                <n-input
                  v-model:value="inputValue"
                  placeholder="输入消息与探路者AI对话..."
                  @keydown="handleKeyDown"
                  :disabled="isGenerating"
                />
                <n-button
                  type="primary"
                  @click="handleSend"
                  :loading="isGenerating"
                  :disabled="!inputValue.trim()"
                >
                  <template #icon>
                    <n-icon><send-outline /></n-icon>
                  </template>
                  发送
                </n-button>
              </n-input-group>
            </div>
          </div>

          <div v-else-if="activeFunction === 'compare'" class="chat-section">
            <div class="messages-container" ref="messagesContainer">
              <div v-if="messages.length === 0" class="empty-state">
                <n-empty :description="`开始与探路者AI对话`">
                  <template #icon>
                    <n-icon size="64" color="#18a058">
                      <compass-outline />
                    </n-icon>
                  </template>
                  <template #extra>
                    <n-text depth="3">{{ currentFunctionDescription }}</n-text>
                  </template>
                </n-empty>
              </div>
              <div v-else class="message-list">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  :class="['message-item', msg.role]"
                >
                  <n-avatar
                    v-if="msg.role === 'assistant'"
                    :style="{ backgroundColor: '#18a058' }"
                    class="message-avatar"
                  >
                    <n-icon><compass-outline /></n-icon>
                  </n-avatar>
                  <div class="message-content">
                    <div class="message-bubble" :class="msg.role">
                      <n-spin v-if="msg.loading" size="small" />
                      <n-text v-else>{{ msg.content }}</n-text>
                    </div>
                  </div>
                  <n-avatar
                    v-if="msg.role === 'user'"
                    :style="{ backgroundColor: '#87d068' }"
                    class="message-avatar"
                  >
                    <n-icon><person-outline /></n-icon>
                  </n-avatar>
                </div>
              </div>
            </div>
            <div class="input-area">
              <n-input-group>
                <n-input
                  v-model:value="inputValue"
                  placeholder="输入消息与探路者AI对话..."
                  @keydown="handleKeyDown"
                  :disabled="isGenerating"
                />
                <n-button
                  type="primary"
                  @click="handleSend"
                  :loading="isGenerating"
                  :disabled="!inputValue.trim()"
                >
                  <template #icon>
                    <n-icon><send-outline /></n-icon>
                  </template>
                  发送
                </n-button>
              </n-input-group>
            </div>
          </div>
        </n-layout-content>
      </n-layout>
    </n-layout>

    <n-modal v-model:show="showPartnerModal" preset="card" title="投资商详情" style="width: 600px;">
      <n-descriptions v-if="selectedPartner" :column="2" bordered label-placement="left">
        <n-descriptions-item label="名称">{{ selectedPartner.name }}</n-descriptions-item>
        <n-descriptions-item label="类型">{{ selectedPartner.type }}</n-descriptions-item>
        <n-descriptions-item label="投资领域">{{ selectedPartner.domain }}</n-descriptions-item>
        <n-descriptions-item label="投资金额">{{ selectedPartner.investmentRange }}</n-descriptions-item>
        <n-descriptions-item label="所在地域">{{ selectedPartner.region }}</n-descriptions-item>
        <n-descriptions-item label="投资阶段">{{ selectedPartner.stage }}</n-descriptions-item>
        <n-descriptions-item label="关注行业">{{ selectedPartner.industries }}</n-descriptions-item>
        <n-descriptions-item label="成功案例">{{ selectedPartner.cases }}</n-descriptions-item>
        <n-descriptions-item label="联系方式" :span="2">{{ selectedPartner.contact }}</n-descriptions-item>
        <n-descriptions-item label="简介" :span="2">{{ selectedPartner.description }}</n-descriptions-item>
      </n-descriptions>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLayoutHeader,
  NAvatar,
  NIcon,
  NButton,
  NInput,
  NInputGroup,
  NInputNumber,
  NSelect,
  NGrid,
  NGi,
  NSpace,
  NText,
  NDivider,
  NList,
  NListItem,
  NEmpty,
  NSpin,
  NCard,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NStatistic,
  NNumberAnimation,
} from 'naive-ui'
import {
  CompassOutline,
  SearchOutline,
  PeopleOutline,
  BarChartOutline,
  DocumentTextOutline,
  GitCompareOutline,
  AddOutline,
  TrashOutline,
  SendOutline,
  MenuOutline,
  PersonOutline,
} from '@vicons/ionicons5'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  loading?: boolean
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

interface Partner {
  id: number
  name: string
  type: string
  domain: string
  investmentRange: string
  region: string
  stage: string
  industries: string
  cases: string
  contact: string
  description: string
  color: string
  image: string
}

const functionList = [
  { key: 'supplier', label: '供应商搜索', icon: SearchOutline, description: '根据需求搜索优质供应商资源' },
  { key: 'partner', label: '合作伙伴推荐', icon: PeopleOutline, description: '智能推荐最适合您的合作伙伴' },
  { key: 'market', label: '市场行情分析', icon: BarChartOutline, description: '实时分析市场动态和趋势' },
  { key: 'industry', label: '行业报告查询', icon: DocumentTextOutline, description: '查询最新行业分析报告' },
  { key: 'compare', label: '资源对比分析', icon: GitCompareOutline, description: '多维度对比分析资源优劣' },
]

const regionOptions = [
  { label: '全国', value: '全国' },
  { label: '华北地区', value: '华北地区' },
  { label: '华东地区', value: '华东地区' },
  { label: '华南地区', value: '华南地区' },
  { label: '华中地区', value: '华中地区' },
  { label: '西南地区', value: '西南地区' },
  { label: '西北地区', value: '西北地区' },
  { label: '东北地区', value: '东北地区' },
]

const partners = ref<Partner[]>([
  { id: 1, name: '鼎晖资本', type: 'VC投资机构', domain: '科技创新', investmentRange: '500-2000万', region: '华东地区', stage: '早期/A轮', industries: '人工智能、生物医药、新能源', cases: '晶心科技、蓝鸟生物、氢能动力', contact: '400-888-9001', description: '专注于科技创新领域的早期投资机构，已投资超过50个项目。', color: '#18a058', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20building%20with%20green%20elements%2C%20professional%20investment%20firm%20headquarters&image_size=landscape_4_3' },
  { id: 2, name: '红杉中国', type: '私募股权', domain: '全行业', investmentRange: '1000-5000万', region: '全国', stage: '成长期/成熟期', industries: '消费、科技、医疗健康', cases: '美团、字节跳动、药明康德', contact: '400-888-9002', description: '全球知名的私募股权投资机构，在中国市场有丰富投资经验。', color: '#dc3545', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20skyscraper%20with%20red%20accents%2C%20global%20investment%20firm&image_size=landscape_4_3' },
  { id: 3, name: '经纬中国', type: 'VC投资机构', domain: '科技创新', investmentRange: '300-3000万', region: '华北地区', stage: '早期/成长期', industries: '企业服务、硬科技、消费', cases: '猎豹移动、瓜子二手车、理想汽车', contact: '400-888-9003', description: '专注于科技创新和消费升级领域的投资机构。', color: '#f08c00', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20space%20with%20orange%20elements%2C%20tech%20investment%20firm&image_size=landscape_4_3' },
  { id: 4, name: '高瓴资本', type: '私募股权', domain: '全行业', investmentRange: '5000万以上', region: '全国', stage: '成熟期/并购', industries: '医疗健康、消费、科技', cases: '百济神州、爱尔眼科、格力电器', contact: '400-888-9004', description: '亚洲地区规模最大的私募股权投资基金之一。', color: '#2080f0', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxurious%20office%20building%20with%20blue%20glass%2C%20premium%20investment%20firm&image_size=landscape_4_3' },
  { id: 5, name: '启明创投', type: 'VC投资机构', domain: '科技创新', investmentRange: '500-2000万', region: '华东地区', stage: '早期/A轮', industries: '人工智能、半导体、企业服务', cases: '小米、云从科技、旷视科技', contact: '400-888-9005', description: '专注于科技创新领域的早期投资机构。', color: '#8a2be2', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20office%20with%20purple%20accents%2C%20venture%20capital%20firm&image_size=landscape_4_3' },
  { id: 6, name: 'IDG资本', type: 'VC投资机构', domain: '全行业', investmentRange: '300-5000万', region: '全国', stage: '早期/成长期', industries: '科技、消费、泛娱乐', cases: '腾讯、百度、携程', contact: '400-888-9006', description: '全球领先的私募股权投资机构，在中国有30年投资经验。', color: '#17a2b8', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=global%20office%20building%20with%20teal%20elements%2C%20international%20investment%20firm&image_size=landscape_4_3' },
  { id: 7, name: '源码资本', type: 'VC投资机构', domain: '科技创新', investmentRange: '200-1000万', region: '华北地区', stage: '早期/A轮', industries: '企业服务、硬科技、消费互联网', cases: '字节跳动、美团、理想汽车', contact: '400-888-9007', description: '专注于科技创新领域的早期投资机构。', color: '#6610f2', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20hub%20with%20indigo%20elements%2C%20venture%20capital%20office&image_size=landscape_4_3' },
  { id: 8, name: 'GGV纪源资本', type: 'VC投资机构', domain: '全行业', investmentRange: '500-3000万', region: '华东地区', stage: '成长期', industries: '企业服务、电商、在线教育', cases: '阿里巴巴、京东、小红书', contact: '400-888-9008', description: '专注于全球市场的风险投资机构。', color: '#e83e8c', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=global%20investment%20office%20with%20pink%20accents%2C%20modern%20venture%20capital%20firm&image_size=landscape_4_3' },
])

const sidebarCollapsed = ref(false)
const activeFunction = ref('supplier')
const activeConversationId = ref<string | null>(null)
const conversations = ref<Conversation[]>([])
const messages = ref<Message[]>([])
const inputValue = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const selectedRegion = ref<string | null>(null)
const investmentMin = ref<number | null>(null)
const investmentMax = ref<number | null>(null)
const showPartnerModal = ref(false)
const selectedPartner = ref<Partner | null>(null)

const trendChartRef = ref<HTMLElement | null>(null)
const industryChartRef = ref<HTMLElement | null>(null)
const regionChartRef = ref<HTMLElement | null>(null)

const currentFunctionLabel = computed(() => {
  return functionList.find(f => f.key === activeFunction.value)?.label || '探路者AI'
})

const currentFunctionDescription = computed(() => {
  return functionList.find(f => f.key === activeFunction.value)?.description || '资源对接专家'
})

const filteredPartners = computed(() => {
  let result = partners.value
  if (selectedRegion.value) {
    result = result.filter(p => p.region === selectedRegion.value || p.region === '全国')
  }
  return result
})

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function switchFunction(key: string) {
  activeFunction.value = key
  if (key === 'market') {
    nextTick(() => {
      initCharts()
    })
  }
}

function handleFilterChange() {
  // 筛选条件变化时的处理
}

function createNewConversation() {
  const newConv: Conversation = {
    id: generateId(),
    title: `${currentFunctionLabel.value} - ${new Date().toLocaleDateString()}`,
    messages: [],
    createdAt: Date.now(),
  }
  conversations.value.unshift(newConv)
  activeConversationId.value = newConv.id
  messages.value = []
}

function switchConversation(convId: string) {
  const conv = conversations.value.find(c => c.id === convId)
  if (conv) {
    activeConversationId.value = convId
    messages.value = conv.messages
  }
}

function saveMessages() {
  const conv = conversations.value.find(c => c.id === activeConversationId.value)
  if (conv) {
    conv.messages = messages.value
    if (messages.value.length > 0) {
      const lastUserMsg = [...messages.value].reverse().find(m => m.role === 'user')
      if (lastUserMsg) {
        conv.title = lastUserMsg.content.slice(0, 20) + (lastUserMsg.content.length > 20 ? '...' : '')
      }
    }
  }
}

function clearMessages() {
  messages.value = []
  saveMessages()
}

function showPartnerDetail(partner: Partner) {
  selectedPartner.value = partner
  showPartnerModal.value = true
}

async function handleSend() {
  const content = inputValue.value.trim()
  if (!content || isGenerating.value) return

  if (!activeConversationId.value) {
    createNewConversation()
  }

  inputValue.value = ''
  isGenerating.value = true

  const userMsg: Message = {
    id: generateId(),
    role: 'user',
    content,
    timestamp: Date.now(),
  }
  messages.value.push(userMsg)
  saveMessages()
  scrollToBottom()

  const assistantMsg: Message = {
    id: generateId(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    loading: true,
  }
  messages.value.push(assistantMsg)
  scrollToBottom()

  try {
    const systemPrompt = getSystemPrompt(activeFunction.value)
    const allMessages = messages.value
      .filter(m => m.id !== assistantMsg.id)
      .map(m => ({ role: m.role, content: m.content }))

    const result = await callAI(allMessages, systemPrompt)

    if (result.error) {
      assistantMsg.content = `抱歉，请求出错：${result.error}`
    } else if (result.content) {
      assistantMsg.content = result.content
    } else {
      assistantMsg.content = '抱歉，未能获取到回复内容。'
    }
  } catch (error) {
    assistantMsg.content = '抱歉，服务暂时不可用，请稍后重试。'
  } finally {
    assistantMsg.loading = false
    isGenerating.value = false
    saveMessages()
    scrollToBottom()
  }
}

function getSystemPrompt(functionType: string): string {
  const prompts: Record<string, string> = {
    supplier: `你是探路者AI，一个专业的资源对接专家。你的专长是帮助用户搜索和筛选优质供应商。

你可以提供以下帮助：
1. 根据产品需求推荐合适的供应商类型
2. 分析供应商的优劣势
3. 提供供应商筛选建议
4. 帮助制定供应商评估标准

请用专业、热情的态度回答用户的问题，并尽可能提供具体的建议和信息。`,
    partner: `你是探路者AI，一个专业的合作伙伴推荐专家。你的专长是帮助用户找到最合适的商业合作伙伴。

你可以提供以下帮助：
1. 分析用户需求，推荐潜在合作伙伴类型
2. 评估合作伙伴的匹配度
3. 提供合作模式建议
4. 分析合作风险和机会

请用专业、客观的态度回答用户的问题，并提供基于数据的分析建议。`,
    market: `你是探路者AI，一个专业的市场行情分析师。你的专长是分析和解读市场动态。

你可以提供以下帮助：
1. 分析当前市场趋势
2. 解读行业数据变化
3. 预测市场发展方向
4. 提供市场进入建议

请用专业、数据驱动的态度回答用户的问题，并尽可能引用具体的数据和案例。`,
    industry: `你是探路者AI，一个专业的行业报告查询专家。你的专长是解读和分析各类行业报告。

你可以提供以下帮助：
1. 解读最新行业报告的主要内容
2. 分析行业发展趋势
3. 提取关键数据和洞察
4. 提供行业对标分析

请用专业、深入的态度回答用户的问题，并帮助用户理解报告的核心价值。`,
    compare: `你是探路者AI，一个专业的资源对比分析专家。你的专长是多维度对比分析不同的资源和选项。

你可以提供以下帮助：
1. 设计对比评估维度
2. 多角度对比分析
3. 总结各方案优劣势
4. 提供选择建议

请用客观、公正的态度回答用户的问题，帮助用户做出明智的决策。`,
  }
  return prompts[functionType] || prompts.supplier
}

async function callAI(messages: { role: string; content: string }[], systemPrompt: string): Promise<{ content?: string; error?: string }> {
  const token = localStorage.getItem('ai-mate-token')
  try {
    const response = await fetch('http://localhost:8080/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages,
        system_prompt: systemPrompt,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.code === 200 && data.data?.choices?.[0]?.message?.content) {
      return { content: data.data.choices[0].message.content }
    } else {
      return { error: data.message || 'Unknown error' }
    }
  } catch (error) {
    console.error('AI API call failed:', error)
    return { error: String(error) }
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function initCharts() {
  // 简单的图表实现 - 使用纯CSS和HTML模拟图表
  // 如果需要真正的图表，可以引入 ECharts 或 Chart.js
}

onMounted(() => {
  if (conversations.value.length === 0) {
    createNewConversation()
  }
})
</script>

<style scoped>
.scout-view {
  height: 100%;
  background-color: #f5f7f9;
}

.scout-layout {
  height: 100%;
}

.scout-sider {
  background-color: #fff;
}

.sider-content {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.role-info {
  text-align: center;
  padding: 16px 0;
}

.role-info h3 {
  margin: 12px 0 4px;
  font-size: 18px;
  color: #333;
}

.role-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.menu-title {
  display: block;
  margin-bottom: 12px;
  font-size: 12px;
}

.function-menu {
  padding: 12px 0;
}

.conversation-history {
  padding: 12px 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.main-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.filter-bar {
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.content-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.message-list {
  max-width: 800px;
  margin: 0 auto;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bubble.user {
  background-color: #18a058;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-bubble.assistant {
  background-color: #fff;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.input-area {
  padding: 16px 20px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.partner-section {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.partner-cards {
  max-width: 1200px;
  margin: 0 auto;
}

.partner-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  overflow: hidden;
  height: 300px;
}

.partner-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.partner-background {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
}

.partner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7));
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.partner-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.partner-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.partner-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.partner-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.market-section {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.market-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.chart-card {
  min-height: 300px;
  border-radius: 12px;
  overflow: hidden;
}

.stat-item {
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  text-align: center;
}
</style>