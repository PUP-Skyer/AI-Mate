 import { describe, it, expect } from 'vitest'
 import type { MindMapNode } from './types'
 import { deepCloneNode, pasteNode, copyNode, cutNode } from './clipboard'
 
 function makeTree(): MindMapNode {
   return {
     id: 'root', text: 'Root', expanded: true,
     children: [
       { id: 'a', text: 'A', expanded: true, children: [
         { id: 'a1', text: 'A1', expanded: true, children: [] },
       ] },
       { id: 'b', text: 'B', expanded: true, children: [] },
     ],
   }
 }
 
 describe('clipboard', () => {
   it('deepCloneNode creates copy with new ids', () => {
     const node = makeTree().children[0]
     const clone = deepCloneNode(node)
     expect(clone.id).not.toBe('a')
     expect(clone.text).toBe('A')
     expect(clone.children[0].id).not.toBe('a1')
     expect(clone.children[0].text).toBe('A1')
   })
 
   it('pasteNode as child adds cloned subtree', () => {
     const tree = makeTree()
     const clipboard = deepCloneNode(tree.children[0])
     const result = pasteNode(tree, 'b', clipboard, 'child')
     const bNode = result.children[1]
     expect(bNode.children).toHaveLength(1)
     expect(bNode.children[0].text).toBe('A')
   })
 
   it('pasteNode as sibling adds after target', () => {
     const tree = makeTree()
     const clipboard = deepCloneNode(tree.children[0])
     const result = pasteNode(tree, 'b', clipboard, 'sibling')
     expect(result.children[2].text).toBe('A')
   })
 
   it('copyNode returns clone without modifying tree', () => {
     const tree = makeTree()
     const copy = copyNode(tree, 'a')
     expect(copy?.text).toBe('A')
     expect(tree.children[0].id).toBe('a') // unchanged
   })
 
   it('cutNode removes node and returns clipboard', () => {
     const tree = makeTree()
     const { tree: newTree, clipboard } = cutNode(tree, 'a')
     expect(newTree.children.map(c => c.id)).toEqual(['b'])
     expect(clipboard?.text).toBe('A')
     expect(clipboard?.children[0].text).toBe('A1')
   })
 })
