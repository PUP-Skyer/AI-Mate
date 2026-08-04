 /**
  * SVG 思维导图布局算法（纯函数）
  * 水平树布局：根在左，子节点向右展开
  */

 import type { MindMapNode, LayoutNode } from './types'

 /** 布局选项 */
 export interface LayoutOptions {
   /** 层间距（水平方向） */
   levelSpacing: number
   /** 节点间距（垂直方向） */
   nodeSpacing: number
   /** 节点默认宽度 */
   nodeWidth: number
   /** 节点默认高度 */
   nodeHeight: number
   /** 根节点 x 起始坐标 */
   rootX: number
   /** 根节点 y 起始坐标 */
   rootY: number
 }

 export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
   levelSpacing: 200,
   nodeSpacing: 40,
   nodeWidth: 140,
   nodeHeight: 36,
   rootX: 40,
   rootY: 40,
 }

 /** 计算子树高度（垂直空间需求） */
 function calculateSubtreeHeight(node: MindMapNode, opts: LayoutOptions): number {
   if (!node.expanded || node.children.length === 0) {
     return opts.nodeHeight + opts.nodeSpacing
   }
   const childrenHeight = node.children.reduce(
     (sum, child) => sum + calculateSubtreeHeight(child, opts),
     0
   )
   return Math.max(opts.nodeHeight + opts.nodeSpacing, childrenHeight)
 }

 /** 计算思维导图布局 */
 export function computeLayout(
   root: MindMapNode,
   options: Partial<LayoutOptions> = {}
 ): LayoutNode[] {
   const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options }
   const result: LayoutNode[] = []

   function layoutNode(
     node: MindMapNode,
     depth: number,
     yStart: number,
     parentId: string | null
   ): number {
     const x = opts.rootX + depth * opts.levelSpacing
     const subtreeHeight = calculateSubtreeHeight(node, opts)
     const y = yStart + subtreeHeight / 2 - opts.nodeHeight / 2

     // 估算节点宽度（根据文本长度）
   const textWidth = Math.max(opts.nodeWidth, node.text.length * 14 + 24)

     result.push({
       id: node.id,
       x,
       y,
       width: textWidth,
       height: opts.nodeHeight,
       depth,
       parentId,
     })

     // 递归布局子节点（仅展开时）
     if (node.expanded && node.children.length > 0) {
       let childY = yStart
       for (const child of node.children) {
         const childSubtreeHeight = calculateSubtreeHeight(child, opts)
         layoutNode(child, depth + 1, childY, node.id)
         childY += childSubtreeHeight
       }
     }

     return subtreeHeight
   }

   layoutNode(root, 0, opts.rootY, null)
   return result
 }

 /** 计算整个布局的总尺寸（用于 SVG viewBox） */
 export function getLayoutSize(layoutNodes: LayoutNode[], opts: LayoutOptions = DEFAULT_LAYOUT_OPTIONS): {
   width: number
   height: number
 } {
   if (layoutNodes.length === 0) {
     return { width: 800, height: 600 }
   }
   const maxX = Math.max(...layoutNodes.map((n) => n.x + n.width)) + opts.rootX
   const maxY = Math.max(...layoutNodes.map((n) => n.y + n.height)) + opts.rootY
   return { width: Math.max(maxX, 400), height: Math.max(maxY, 300) }
 }

 /** 获取两个节点之间的贝塞尔曲线路径 */
 export function getBezierPath(
   fromX: number, fromY: number,
   toX: number, toY: number
 ): string {
   const dx = Math.abs(toX - fromX)
   const cp1x = fromX + dx * 0.5
   const cp1y = fromY
   const cp2x = toX - dx * 0.5
   const cp2y = toY
   return `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`
 }
