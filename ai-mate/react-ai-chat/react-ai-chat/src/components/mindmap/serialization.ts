 /**
  * 幕布风格大纲思维导图 - 序列化与导入导出
  * 支持 txt（缩进式纯文本）、md（Markdown 列表）、json 互转
  */

 import type { MindMapNode } from './types'
 import { generateNodeId, createNode } from './types'
 
 /** 树转大纲文本（Tab 缩进） */
 export function treeToOutline(root: MindMapNode): string {
   const lines: string[] = [root.text]
   const walk = (node: MindMapNode, depth: number) => {
     for (const child of node.children) {
       lines.push('\t'.repeat(depth) + child.text)
       walk(child, depth + 1)
     }
   }
   walk(root, 1)
   return lines.join('\n')
 }
 
 /** 树转 Markdown（`-` 列表，2 空格缩进） */
 export function treeToMarkdown(root: MindMapNode): string {
   const lines: string[] = [`# ${root.text}`, '']
   const walk = (node: MindMapNode, depth: number) => {
     for (const child of node.children) {
       const indent = '  '.repeat(depth)
       let line = `${indent}- ${child.text}`
       if (child.notes) line += ` <!-- ${child.notes.replace(/-->/g, '')} -->`
       if (child.tags?.length) line += ` #${child.tags.join(' #')}`
       lines.push(line)
       walk(child, depth + 1)
     }
   }
   walk(root, 0)
   return lines.join('\n')
 }
 
 /** 树转 JSON 字符串 */
 export function treeToJson(root: MindMapNode): string {
   return JSON.stringify(root, null, 2)
 }
 
 /** 大纲文本（Tab 缩进）转树 */
 export function outlineToTree(text: string): MindMapNode {
   const lines = text.split('\n').filter((l) => l.trim() !== '')
   if (lines.length === 0) return createNode('空白思维导图')
 
   // First non-indented line is root
   const root: MindMapNode = {
     id: generateNodeId(),
     text: lines[0].trim(),
     children: [],
     expanded: true,
   }
 
   const stack: { node: MindMapNode; indent: number }[] = [{ node: root, indent: 0 }]
 
   for (let i = 1; i < lines.length; i++) {
     const line = lines[i]
     const indent = line.match(/^\t*/)?.[0].length ?? 0
     const text = line.trim()
     const newNode: MindMapNode = { id: generateNodeId(), text, children: [], expanded: true }
 
     while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
       stack.pop()
     }
     const parent = stack[stack.length - 1].node
     parent.children.push(newNode)
     stack.push({ node: newNode, indent })
   }
 
   return root
 }
 
 /** Markdown 列表转树（支持 - 和 * 开头，2 空格缩进） */
 export function markdownToTree(md: string): MindMapNode {
   const lines = md.split('\n').filter((l) => l.trim() !== '')
   if (lines.length === 0) return createNode('空白思维导图')
 
   // Find first heading as root
   const rootLine = lines.find((l) => /^#\s+/.test(l.trim()))
   const rootText = rootLine ? rootLine.replace(/^#+\s*/, '') : '思维导图'
   const root: MindMapNode = {
     id: generateNodeId(),
     text: rootText,
     children: [],
     expanded: true,
   }
 
   const stack: { node: MindMapNode; indent: number }[] = [{ node: root, indent: -1 }]
 
   for (const line of lines) {
     const trimmed = line.trim()
     if (/^#/.test(trimmed)) continue // skip headings
     const listMatch = trimmed.match(/^(\s*)([-*])\s+(.+)$/)
     if (!listMatch) continue
     const indent = Math.floor(line.match(/^\s*/)?.[0].length ?? 0 / 2)
     const text = listMatch[3].replace(/\s*<!--.*?-->\s*$/, '').trim()
     const tags = text.match(/#(\S+)/g)?.map((t) => t.slice(1))
     const cleanText = text.replace(/\s*#(\S+)/g, '').replace(/\s*<!--.*?-->\s*$/, '').trim()
 
     const newNode: MindMapNode = {
       id: generateNodeId(),
       text: cleanText,
       children: [],
       expanded: true,
       tags: tags?.length ? tags : undefined,
     }
 
     while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
       stack.pop()
     }
     const parent = stack[stack.length - 1].node
     parent.children.push(newNode)
     stack.push({ node: newNode, indent })
   }
 
   return root
 }
 
 /** JSON 字符串转树 */
 export function jsonToTree(json: string): MindMapNode {
   return JSON.parse(json) as MindMapNode
 }
