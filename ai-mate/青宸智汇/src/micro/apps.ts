import type { RegistrableApp } from 'qiankun'

const apps: RegistrableApp<Record<string, unknown>>[] = [
  {
    name: 'vue-community',
    entry: import.meta.env.VITE_VUE_COMMUNITY_URL,
    container: '#subapp-container',
    activeRule: '/community',
  },
  {
    name: 'vue-resource',
    entry: import.meta.env.VITE_VUE_RESOURCE_URL,
    container: '#subapp-container',
    activeRule: '/resource',
  },
  {
    name: 'vue-dashboard',
    entry: import.meta.env.VITE_VUE_DASHBOARD_URL,
    container: '#subapp-container',
    activeRule: '/dashboard',
  },
  {
    name: 'vue-user',
    entry: import.meta.env.VITE_VUE_USER_URL,
    container: '#subapp-container',
    activeRule: '/user',
  },
  {
    name: 'react-ai-chat',
    entry: import.meta.env.VITE_REACT_AI_CHAT_URL,
    container: '#subapp-container',
    activeRule: '/ai-chat',
  },
  {
    name: 'react-bp-gen',
    entry: import.meta.env.VITE_REACT_BP_GEN_URL,
    container: '#subapp-container',
    activeRule: '/bp-gen',
  },
  {
    name: 'react-collab',
    entry: import.meta.env.VITE_REACT_COLLAB_URL,
    container: '#subapp-container',
    activeRule: '/collab',
  },
]

export { apps }
