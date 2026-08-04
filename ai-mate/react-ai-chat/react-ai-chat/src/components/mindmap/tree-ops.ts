 /**
  * 幕布风格大纲思维导图 - 树操作纯函数
  * 所有函数均不可变（返回新树，不改原树）
  */

 import type { MindMapNode, DropPosition } from './types'
 
 // ─── 查找与遍历 ───
 
 /** 根据 id 查找节点 */
 export function findNode(root: MindMapNode, id: string): MindMapNode | undefined {
   if (root.id === id) return root
   for (const child of root.children) {
     const found = findNode(child, id)
     if (found) return found
   }
   return undefined
 }
 
 /** 查找从根到目标的路径（包含根和目标） */
 export function findPath(root: MindMapNode, id: string): MindMapNode[] {
   if (root.id === id) return [root]
   for (const child of root.children) {
     const subPath = findPath(child, id)
     if (subPath.length > 0) return [root, ...subPath]
   }
   return []
 }
 
 /** 查找节点的父节点 */
 export function findParent(root: MindMapNode, id: string): MindMapNode | undefined {
   for (const child of root.children) {
     if (child.id === id) return root
     const found = findParent(child, id)
     if (found) return found
   }
   return undefined
 }
 
 /** 计算后代节点数量（不含自身） */
 export function countDescendants(node: MindMapNode): number {
   return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0)
 }
 
 /** 遍历所有节点（深度优先，前序） */
 export function walkTree(node: MindMapNode, fn: (n: MindMapNode) => void): void {
   fn(node)
   for (const child of node.children) {
     walkTree(child, fn)
   }
 }
 
 /** 映射整棵树（返回新树） */
 export function mapTree(node: MindMapNode, fn: (n: MindMapNode) => MindMapNode): MindMapNode {
   const mapped = fn(node)
   return { ...mapped, children: mapped.children.map((c) => mapTree(c, fn)) }
 }
 
 // ─── 增删改 ───
 
 /** 更新节点文本 */
 export function updateNodeText(root: MindMapNode, id: string, text: string): MindMapNode {
   if (root.id === id) return { ...root, text }
   return { ...root, children: root.children.map((c) => updateNodeText(c, id, text)) }
 }
 
 /** 切换展开/折叠 */
 export function toggleExpand(root: MindMapNode, id: string): MindMapNode {
   if (root.id === id) return { ...root, expanded: !root.expanded }
   return { ...root, children: root.children.map((c) => toggleExpand(c, id)) }
 }
 
 /** 设置展开状态 */
 export function setExpand(root: MindMapNode, id: string, expanded: boolean): MindMapNode {
   if (root.id === id) return { ...root, expanded }
   return { ...root, children: root.children.map((c) => setExpand(c, id, expanded)) }
 }
 
 /** 添加子节点（追加到末尾，自动展开父节点） */
 export function addChild(root: MindMapNode, parentId: string, newNode: MindMapNode): MindMapNode {
   if (root.id === parentId) {
     return { ...root, children: [...root.children, newNode], expanded: true }
   }
   return { ...root, children: root.children.map((c) => addChild(c, parentId, newNode)) }
 }
 
 /** 添加同级节点（在目标 id 之后插入） */
 export function addSibling(root: MindMapNode, id: string, newNode: MindMapNode): MindMapNode {
   const parent = findParent(root, id)
   if (!parent) return root // cannot add sibling to root
   const index = parent.children.findIndex((c) => c.id === id)
   if (index === -1) return root
   const newChildren = [...parent.children.slice(0, index + 1), newNode, ...parent.children.slice(index + 1)]
   return replaceChild(root, parent.id, { ...parent, children: newChildren })
 }
 
 /** 删除节点（返回新树；不能删除根） */
 export function removeNode(root: MindMapNode, id: string): MindMapNode {
   if (root.id === id) return root // root protection
   return {
     ...root,
     children: root.children
       .filter((c) => c.id !== id)
       .map((c) => removeNode(c, id)),
   }
 }
 
 /** 更新节点元数据（notes/tags/color/checked） */
 export function updateNodeMeta(root: MindMapNode, id: string, patch: Partial<MindMapNode>): MindMapNode {
   if (root.id === id) return { ...root, ...patch }
   return { ...root, children: root.children.map((c) => updateNodeMeta(c, id, patch)) }
 }
 
 // ─── 层级升降（Tab/Shift+Tab） ───
 
 /** 缩进降级：将 id 节点变为"前一个同级兄弟"的最后一个子节点 */
 export function indent(root: MindMapNode, id: string): MindMapNode {
   const parent = findParent(root, id)
   if (!parent) return root // root cannot be indented
   const index = parent.children.findIndex((c) => c.id === id)
   if (index <= 0) return root // first child cannot be indented
 
   const prevSibling = parent.children[index - 1]
   const node = parent.children[index]
   const newPrev = {
     ...prevSibling,
     children: [...prevSibling.children, node],
     expanded: true,
   }
   const newChildren = [...parent.children.slice(0, index - 1), newPrev, ...parent.children.slice(index + 1)]
   return replaceChild(root, parent.id, { ...parent, children: newChildren })
 }
 
 /** 升级：将 id 节点升级为其祖父的同级（紧跟其原父节点之后） */
 export function outdent(root: MindMapNode, id: string): MindMapNode {
   const parent = findParent(root, id)
   if (!parent) return root // root cannot be outdented
   const grandparent = findParent(root, parent.id)
   if (!grandparent) return root // already at root level
 
   const index = parent.children.findIndex((c) => c.id === id)
   const node = parent.children[index]
   const parentIndex = grandparent.children.findIndex((c) => c.id === parent.id)
 
   // Remove from parent
   const newParentChildren = parent.children.filter((c) => c.id !== id)
   const newParent = { ...parent, children: newParentChildren }
 
   // Simpler approach: rebuild grandparent children
   const rebuiltGrandchildren = [
     ...grandparent.children.slice(0, parentIndex),
     newParent,
     node,
     ...grandparent.children.slice(parentIndex + 1),
   ]
   const newGrandparent = { ...grandparent, children: rebuiltGrandchildren }
   return replaceChild(root, grandparent.id, newGrandparent)
 }
 
 // ─── 移动排序（拖拽） ───
 
 /** 检查 candidateId 是否是 root 的后代（不含自身） */
 export function isDescendant(root: MindMapNode, candidateId: string): boolean {
   for (const child of root.children) {
     if (child.id === candidateId) return true
     if (isDescendant(child, candidateId)) return true
   }
   return false
 }
 
 /** 移动节点到目标位置 */
 export function moveNode(
   root: MindMapNode,
   sourceId: string,
   targetId: string,
   position: DropPosition
 ): MindMapNode {
   if (sourceId === targetId) return root
   if (sourceId === root.id) return root // cannot move root
 
   const sourceNode = findNode(root, sourceId)
   if (!sourceNode) return root
 
   // Prevent moving into own descendant
   if (position === 'inside' && isDescendant(sourceNode, targetId)) return root
   if ((position === 'before' || position === 'after')) {
     // If target is a descendant of source, prevent
     if (isDescendant(sourceNode, targetId)) return root
   }
 
   // Remove source from tree
   const withoutSource = removeNode(root, sourceId)
 
   if (position === 'inside') {
     return addChild(withoutSource, targetId, sourceNode)
   }
 
 // For before/after, find target's parent and insert
   const targetParent = findParent(withoutSource, targetId)
   if (!targetParent) return withoutSource // target is root, can't insert before/after root
   const targetIndex = targetParent.children.findIndex((c) => c.id === targetId)
   const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
   const newChildren = [
     ...targetParent.children.slice(0, insertIndex),
     sourceNode,
     ...targetParent.children.slice(insertIndex),
   ]
   return replaceChild(withoutSource, targetParent.id, { ...targetParent, children: newChildren })
 }
 
 // ─── 全展开/全折叠 ───
 
 /** 全部展开 */
 export function expandAll(root: MindMapNode): MindMapNode {
   return mapTree(root, (n) => ({ ...n, expanded: true }))
 }
 
 /** 全部折叠 */
 export function collapseAll(root: MindMapNode): MindMapNode {
   return mapTree(root, (n) => ({ ...n, expanded: false }))
 }
 
 // ─── 内部工具函数 ───
 
 /** 替换指定 id 的子节点（递归查找） */
 function replaceChild(root: MindMapNode, parentId: string, newChild: MindMapNode): MindMapNode {
   if (root.id === parentId) return newChild
   return {
     ...root,
     children: root.children.map((c) => replaceChild(c, parentId, newChild)),
   }
 }

 // ─── 搜索 ───

 /** 搜索节点：返回匹配的节点 id 和需展开的祖先路径 id */
 export function searchNodes(root: MindMapNode, query: string): { ids: string[]; pathIds: string[] } {
   if (!query.trim()) return { ids: [], pathIds: [] }
   const lowerQuery = query.toLowerCase()
   const ids: string[] = []
   const pathIds = new Set<string>()

   function walk(node: MindMapNode, ancestors: string[]) {
     const matched = node.text.toLowerCase().includes(lowerQuery)
     if (matched) {
       ids.push(node.id)
       // Mark all ancestors as path ids (to expand)
       for (const ancestorId of ancestors) {
         pathIds.add(ancestorId)
       }
     }
     // Also match in notes
     if (node.notes?.toLowerCase().includes(lowerQuery)) {
       if (!ids.includes(node.id)) ids.push(node.id)
       for (const ancestorId of ancestors) {
         pathIds.add(ancestorId)
       }
     }
     for (const child of node.children) {
       walk(child, [...ancestors, node.id])
     }
   }

   walk(root, [])
   return { ids, pathIds: Array.from(pathIds) }
 }
