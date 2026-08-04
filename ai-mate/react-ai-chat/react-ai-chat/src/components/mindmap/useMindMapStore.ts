 /**
  * 幕布风格大纲思维导图 - Zustand Store
  * 集中管理思维导图数据 + localStorage 持久化
  */

 import { create } from 'zustand'
 import { immer } from 'zustand/middleware/immer'
 import type { MindMapNode, MindMapData, LayoutMode, DropPosition } from './types'
 import { createEmptyMindMapData, createNode, generateNodeId, treeNodeToMindMapNode } from './types'
 import type { TreeNode } from '../sage/bmc-utils'
 import {
  updateNodeText, toggleExpand, addChild, addSibling,
   removeNode, updateNodeMeta, indent, outdent, moveNode,
   expandAll, collapseAll, findNode,
 } from './tree-ops'
 import { cutNode, copyNode, pasteNode } from './clipboard'
 import { message } from 'antd'
 
 const MINDMAP_KEY = 'ai-mate-sage-mindmap'
 
 /** 从 localStorage 读取思维导图数据 */
 function loadMindMapData(): MindMapData | null {
   try {
     const raw = localStorage.getItem(MINDMAP_KEY)
     if (!raw) return null
     const parsed = JSON.parse(raw) as MindMapData
     if (!parsed || typeof parsed.projectName !== 'string' || !parsed.root) return null
     return parsed
   } catch {
     return null
   }
 }
 
 /** 保存思维导图数据到 localStorage */
 function saveMindMapData(data: MindMapData): void {
   try {
     localStorage.setItem(MINDMAP_KEY, JSON.stringify(data))
   } catch {
     message.warning('思维导图数据过大，请导出 JSON 备份')
   }
 }
 
 interface MindMapStore {
   /** 思维导图数据（单根模式） */
   data: MindMapData | null
   /** 当前布局模式 */
   layoutMode: LayoutMode
   /** 剪切板中的节点 */
   clipboard: MindMapNode | null
   /** 当前选中节点 id */
   selectedId: string | null
   /** 搜索关键词 */
   searchQuery: string
   /** 是否显示复选框 */
   showCheckbox: boolean
 
   // Actions
   setText: (id: string, text: string) => void
   addChildNode: (parentId: string) => void
   addSiblingNode: (id: string) => void
   removeNodeById: (id: string) => void
   indentNode: (id: string) => void
   outdentNode: (id: string) => void
   moveNodeById: (sourceId: string, targetId: string, position: DropPosition) => void
   toggleNodeExpand: (id: string) => void
   expandAllNodes: () => void
   collapseAllNodes: () => void
   cut: (id: string) => void
   copy: (id: string) => void
   paste: (targetId: string, mode: 'child' | 'sibling') => void
   updateMeta: (id: string, patch: Partial<MindMapNode>) => void
   setLayoutMode: (mode: LayoutMode) => void
   setSelectedId: (id: string | null) => void
   setSearchQuery: (query: string) => void
   setShowCheckbox: (show: boolean) => void
   loadFromBMC: (dimensions: Record<string, TreeNode>, projectName: string) => void
   newMap: (projectName?: string) => void
   setRoot: (root: MindMapNode, projectName?: string) => void
 }
 
 export const useMindMapStore = create<MindMapStore>()(
   immer<MindMapStore>((set, get) => ({
     data: loadMindMapData(),
     layoutMode: 'split',
     clipboard: null,
     selectedId: null,
     searchQuery: '',
     showCheckbox: false,
 
     setText: (id, text) => {
       const state = get()
       if (!state.data) return
       const newRoot = updateNodeText(state.data.root, id, text)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     addChildNode: (parentId) => {
       const state = get()
       if (!state.data) return
       const newNode = createNode('新节点')
       const newRoot = addChild(state.data.root, parentId, newNode)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData, selectedId: newNode.id })
       saveMindMapData(newData)
     },
 
     addSiblingNode: (id) => {
       const state = get()
       if (!state.data) return
       const newNode = createNode('新节点')
       const newRoot = addSibling(state.data.root, id, newNode)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData, selectedId: newNode.id })
       saveMindMapData(newData)
     },
 
     removeNodeById: (id) => {
       const state = get()
       if (!state.data) return
       const newRoot = removeNode(state.data.root, id)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData, selectedId: null })
       saveMindMapData(newData)
     },
 
     indentNode: (id) => {
       const state = get()
       if (!state.data) return
       const newRoot = indent(state.data.root, id)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     outdentNode: (id) => {
       const state = get()
       if (!state.data) return
       const newRoot = outdent(state.data.root, id)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     moveNodeById: (sourceId, targetId, position) => {
       const state = get()
       if (!state.data) return
       const newRoot = moveNode(state.data.root, sourceId, targetId, position)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     toggleNodeExpand: (id) => {
       const state = get()
       if (!state.data) return
       const newRoot = toggleExpand(state.data.root, id)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       // Note: we DO save on toggle expand so the expanded state persists
       saveMindMapData(newData)
     },
 
     expandAllNodes: () => {
       const state = get()
       if (!state.data) return
       const newRoot = expandAll(state.data.root)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     collapseAllNodes: () => {
       const state = get()
       if (!state.data) return
       const newRoot = collapseAll(state.data.root)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     cut: (id) => {
       const state = get()
       if (!state.data) return
       const { tree, clipboard } = cutNode(state.data.root, id)
       const newData = { ...state.data, root: tree, updatedAt: Date.now() }
       set({ data: newData, clipboard, selectedId: null })
       saveMindMapData(newData)
     },
 
     copy: (id) => {
       const state = get()
       if (!state.data) return
       const clipboard = copyNode(state.data.root, id)
       set({ clipboard })
     },
 
     paste: (targetId, mode) => {
       const state = get()
       if (!state.data || !state.clipboard) return
       const newRoot = pasteNode(state.data.root, targetId, state.clipboard, mode)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     updateMeta: (id, patch) => {
       const state = get()
       if (!state.data) return
       const newRoot = updateNodeMeta(state.data.root, id, patch)
       const newData = { ...state.data, root: newRoot, updatedAt: Date.now() }
       set({ data: newData })
       saveMindMapData(newData)
     },
 
     setLayoutMode: (mode) => set({ layoutMode: mode }),
     setSelectedId: (id) => set({ selectedId: id }),
     setSearchQuery: (query) => set({ searchQuery: query }),
     setShowCheckbox: (show) => set({ showCheckbox: show }),
 
     loadFromBMC: (dimensions, projectName) => {
       const dimensionKeys = Object.keys(dimensions)
       const roots = dimensionKeys.map((key) => treeNodeToMindMapNode(dimensions[key]))
       const root: MindMapNode = {
         id: 'bmc-virtual-root',
         text: projectName || '商业模式画布',
         expanded: true,
         children: roots,
       }
       const newData: MindMapData = {
         projectName: projectName || '商业模式画布',
         root,
         updatedAt: Date.now(),
       }
       set({ data: newData, selectedId: null })
       saveMindMapData(newData)
     },
 
     newMap: (projectName) => {
       const newData = createEmptyMindMapData(projectName)
       set({ data: newData, selectedId: null, clipboard: null, searchQuery: '' })
       saveMindMapData(newData)
     },
 
     setRoot: (root, projectName) => {
       const newData: MindMapData = {
         projectName: projectName || root.text || '思维导图',
         root,
         updatedAt: Date.now(),
       }
       set({ data: newData, selectedId: null })
       saveMindMapData(newData)
     },
   }))
 )
 
 /** 获取选中节点 */
 export function useSelectedNode(): MindMapNode | null {
   const { data, selectedId } = useMindMapStore()
   if (!data || !selectedId) return null
   return findNode(data.root, selectedId) ?? null
 }
 
 /** 导出 store 用于测试 */
 export { MINDMAP_KEY as _MINDMAP_KEY }
 // Re-export generateNodeId for convenience
 export { generateNodeId }
