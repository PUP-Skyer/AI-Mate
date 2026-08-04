 /**
  * 幕布风格大纲思维导图 - 类型定义
  * 兼容 sage/bmc-utils.ts 的 TreeNode，扩展富文本字段
  */

 /** 从 bmc-utils.ts 引入 TreeNode 以做兼容转换 */
 import type { TreeNode } from '../sage/bmc-utils'

 /** 思维导图节点（扩展自 TreeNode，增加富文本字段） */
 export interface MindMapNode {
   id: string
   text: string
   children: MindMapNode[]
   expanded: boolean
   /** 节点备注 */
   notes?: string
   /** 标签列表 */
   tags?: string[]
   /** 颜色标记（十六进制） */
   color?: string
   /** 复选框状态（任务清单模式） */
   checked?: boolean
 }

 /** 思维导图数据（单根模式，独立 tab 使用） */
 export interface MindMapData {
   projectName: string
   root: MindMapNode
   updatedAt: number
 }

 /** 布局模式（禁止 enum，用联合类型） */
 export type LayoutMode = 'outline' | 'mindmap' | 'split'

 /** 拖拽放置位置 */
 export type DropPosition = 'before' | 'after' | 'inside'

 /** 导出格式 */
 export type ExportFormat = 'txt' | 'md' | 'json' | 'png'

 /** SVG 布局计算结果中的单个节点 */
 export interface LayoutNode {
   id: string
   x: number
   y: number
   width: number
   height: number
   depth: number
   /** 父节点 id（根节点为 null） */
   parentId: string | null
 }

 /** 搜索结果 */
 export interface SearchResult {
   /** 匹配的节点 id 列表 */
   ids: string[]
   /** 需展开的祖先路径 id 列表 */
   pathIds: string[]
 }

 /**
  * 将 TreeNode 转换为 MindMapNode（兼容转换）
 * 递归处理子节点，可选字段补默认值
  */
 export function treeNodeToMindMapNode(node: TreeNode): MindMapNode {
   return {
     id: node.id,
     text: node.text,
     children: node.children.map(treeNodeToMindMapNode),
     expanded: node.expanded,
   }
 }

 /** 生成唯一 id */
 export function generateNodeId(): string {
   return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
 }

 /** 创建空节点 */
 export function createNode(text = '新节点'): MindMapNode {
   return {
     id: generateNodeId(),
     text,
     children: [],
     expanded: true,
   }
 }

 /** 创建空思维导图数据 */
 export function createEmptyMindMapData(projectName = '思维导图'): MindMapData {
   return {
     projectName,
     root: {
       id: 'root',
       text: projectName,
       children: [],
       expanded: true,
     },
     updatedAt: Date.now(),
   }
 }
