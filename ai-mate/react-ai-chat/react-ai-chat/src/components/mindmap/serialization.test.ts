 import { describe, it, expect } from 'vitest'
 import type { MindMapNode } from './types'
 import {
   treeToOutline,
   treeToMarkdown,
   treeToJson,
   outlineToTree,
   markdownToTree,
   jsonToTree,
 } from './serialization'
 
 function makeTree(): MindMapNode {
   return {
     id: 'root', text: 'Root', expanded: true,
     children: [
       { id: 'a', text: 'Item A', expanded: true, children: [
         { id: 'a1', text: 'Sub A1', expanded: true, children: [] },
       ] },
       { id: 'b', text: 'Item B', expanded: true, children: [] },
     ],
   }
 }
 
 describe('serialization: treeToOutline', () => {
   it('converts tree to tab-indented text', () => {
     const text = treeToOutline(makeTree())
     expect(text).toContain('Root')
     expect(text).toContain('\tItem A')
     expect(text).toContain('\t\tSub A1')
   })
 })
 
 describe('serialization: treeToMarkdown', () => {
   it('converts tree to markdown list', () => {
     const md = treeToMarkdown(makeTree())
     expect(md).toContain('# Root')
     expect(md).toContain('- Item A')
     expect(md).toContain('  - Sub A1')
   })
 
   it('includes notes and tags in markdown', () => {
     const tree: MindMapNode = {
       id: 'r', text: 'R', expanded: true,
       children: [{ id: 'c', text: 'C', expanded: true, children: [], notes: 'note', tags: ['tag1'] }],
     }
     const md = treeToMarkdown(tree)
     expect(md).toContain('<!-- note -->')
     expect(md).toContain('#tag1')
   })
 })
 
 describe('serialization: treeToJson', () => {
   it('converts tree to JSON', () => {
     const json = treeToJson(makeTree())
     const parsed = JSON.parse(json)
     expect(parsed.id).toBe('root')
     expect(parsed.children[0].id).toBe('a')
   })
 })
 
 describe('serialization: round-trip', () => {
   it('outline round-trip: tree -> text -> tree preserves structure', () => {
     const tree = makeTree()
     const text = treeToOutline(tree)
     const restored = outlineToTree(text)
     expect(restored.text).toBe('Root')
     expect(restored.children[0].text).toBe('Item A')
     expect(restored.children[0].children[0].text).toBe('Sub A1')
     expect(restored.children[1].text).toBe('Item B')
   })
 
   it('markdown round-trip: tree -> md -> tree preserves structure', () => {
     const tree = makeTree()
     const md = treeToMarkdown(tree)
     const restored = markdownToTree(md)
     expect(restored.text).toBe('Root')
     expect(restored.children[0].text).toBe('Item A')
     expect(restored.children[0].children[0].text).toBe('Sub A1')
   })
 
   it('json round-trip: tree -> json -> tree preserves everything', () => {
     const tree = makeTree()
     const json = treeToJson(tree)
     const restored = jsonToTree(json)
     expect(restored).toEqual(tree)
   })
 })
 
 describe('serialization: edge cases', () => {
   it('outlineToTree handles empty text', () => {
     const tree = outlineToTree('')
     expect(tree.children).toHaveLength(0)
   })
 
   it('markdownToTree handles empty text', () => {
     const tree = markdownToTree('')
     expect(tree.children).toHaveLength(0)
   })
 })
