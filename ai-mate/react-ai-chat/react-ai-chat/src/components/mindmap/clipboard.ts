 /**
  * 幕布风格大纲思维导图 - 剪切板操作（剪切/复制/粘贴）
  * 纯函数，不依赖 React
  */

 import type { MindMapNode } from './types'
 import { generateNodeId } from './types'
 import { addChild, addSibling, removeNode } from './tree-ops'
 
 /** 深拷贝节点并重新生成所有 id（避免 id 冲突） */
 export function deepCloneNode(node: MindMapNode): MindMapNode {
   return {
     id: generateNodeId(),
     text: node.text,
     expanded: node.expanded,
     children: node.children.map(deepCloneNode),
     notes: node.notes,
     tags: node.tags ? [...node.tags] : undefined,
     color: node.color,
     checked: node.checked,
   }
 }
 
 /** 粘贴节点（作为子节点或同级节点） */
 export function pasteNode(
   root: MindMapNode,
   targetId: string,
   clipboardNode: MindMapNode,
   mode: 'child' | 'sibling'
 ): MindMapNode {
   const cloned = deepCloneNode(clipboardNode)
   if (mode === 'child') {
     return addChild(root, targetId, cloned)
   }
   return addSibling(root, targetId, cloned)
 }
 
 /** 复制：返回节点副本（原始树不变，副本存入剪贴板） */
 export function copyNode(root: MindMapNode, id: string): MindMapNode | null {
   const found = findNodeSafe(root, id)
   return found ? deepCloneNode(found) : null
 }
 
 /** 剪切：从树中移除节点，返回新树 + 节点副本 */
 export function cutNode(root: MindMapNode, id: string): { tree: MindMapNode; clipboard: MindMapNode | null } {
   const found = findNodeSafe(root, id)
   if (!found) return { tree: root, clipboard: null }
   const clipboard = deepCloneNode(found)
   const tree = removeNode(root, id)
   return { tree, clipboard }
 }
 
 // ─── 内部工具 ───
 
 function findNodeSafe(root: MindMapNode, id: string): MindMapNode | null {
   if (root.id === id) return root
   for (const child of root.children) {
     const found = findNodeSafe(child, id)
     if (found) return found
   }
   return null
 }
