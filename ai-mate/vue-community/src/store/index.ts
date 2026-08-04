import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCommunityStore = defineStore('community', () => {
  const posts = ref<any[]>([])
  const currentPost = ref<any>(null)
  const loading = ref(false)

  return {
    posts,
    currentPost,
    loading,
  }
})
