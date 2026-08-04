 import { describe, it, expect } from 'vitest'
 import type { MindMapNode } from './types'
 import { createNode } from './types'
 import {
   findNode,
   findPath,
   findParent,
   countDescendants,
   mapTree,
   walkTree,
   updateNodeText,
   toggleExpand,
   setExpand,
   addChild,
   addSibling,
   removeNode,
   updateNodeMeta,
   indent,
   outdent,
   moveNode,
   isDescendant,
   expandAll,
   collapseAll,
 } from './tree-ops'
 
 /** 构建测试树:
  *        root
  *       / | \
  *      a  b  c
  *     / \    |
  *    d   e   f
  *       /
  *      g
  */
 function makeTestTree(): MindMapNode {
   return {
     id: 'root',
     text: 'Root',
     expanded: true,
     children: [
       {
         id: 'a', text: 'A', expanded: true,
         children: [
           { id: 'd', text: 'D', expanded: true, children: [] },
           { id: 'e', text: 'E', expanded: true, children: [
             { id: 'g', text: 'G', expanded: true, children: [] },
           ] },
         ],
       },
       { id: 'b', text: 'B', expanded: true, children: [] },
       { id: 'c', text: 'C', expanded: true, children: [
         { id: 'f', text: 'F', expanded: true, children: [] },
       ] },
     ],
   }
 }
 
 describe('tree-ops: find & traverse', () => {
   it('findNode finds by id at various depths', () => {
     const tree = makeTestTree()
     expect(findNode(tree, 'root')?.text).toBe('Root')
     expect(findNode(tree, 'g')?.text).toBe('G')
     expect(findNode(tree, 'nonexistent')).toBeUndefined()
   })
 
   it('findPath returns root-to-target path', () => {
     const tree = makeTestTree()
     const path = findPath(tree, 'g')
     expect(path.map(n => n.id)).toEqual(['root', 'a', 'e', 'g'])
   })
 
   it('findPath returns empty for missing id', () => {
     const tree = makeTestTree()
     expect(findPath(tree, 'missing')).toEqual([])
   })
 
   it('findParent returns parent node', () => {
     const tree = makeTestTree()
     expect(findParent(tree, 'g')?.id).toBe('e')
     expect(findParent(tree, 'a')?.id).toBe('root')
     expect(findParent(tree, 'root')).toBeUndefined()
   })
 
   it('countDescendants counts all descendants', () => {
     const tree = makeTestTree()
     expect(countDescendants(tree)).toBe(7) // a,b,c,d,e,f,g
     expect(countDescendants(tree.children[0])).toBe(3) // d,e,g
     expect(countDescendants(tree.children[1])).toBe(0) // b has no children
   })
 
   it('mapTree transforms all nodes', () => {
     const tree = makeTestTree()
     const mapped = mapTree(tree, (n) => ({ ...n, text: `[${n.text}]` }))
     expect(findNode(mapped, 'g')?.text).toBe('[G]')
   })
 
   it('walkTree visits all nodes', () => {
     const tree = makeTestTree()
     const visited: string[] = []
     walkTree(tree, (n) => visited.push(n.id))
     expect(visited).toEqual(['root', 'a', 'd', 'e', 'g', 'b', 'c', 'f'])
   })
 })
 
 describe('tree-ops: update operations', () => {
   it('updateNodeText updates text immutably', () => {
     const tree = makeTestTree()
     const updated = updateNodeText(tree, 'g', 'New G')
     expect(findNode(updated, 'g')?.text).toBe('New G')
     expect(findNode(tree, 'g')?.text).toBe('G') // original unchanged
   })
 
   it('toggleExpand toggles expanded state', () => {
     const tree = makeTestTree()
     const toggled = toggleExpand(tree, 'a')
     expect(findNode(toggled, 'a')?.expanded).toBe(false)
     expect(findNode(tree, 'a')?.expanded).toBe(true) // original unchanged
   })
 
   it('setExpand sets expanded state', () => {
     const tree = makeTestTree()
     const collapsed = setExpand(tree, 'a', false)
     expect(findNode(collapsed, 'a')?.expanded).toBe(false)
   })
 
   it('addChild appends child and expands parent', () => {
     const tree = makeTestTree()
     const newNode = createNode('New Child')
     const result = addChild(tree, 'b', newNode)
     const bNode = findNode(result, 'b')
     expect(bNode?.children).toHaveLength(1)
     expect(bNode?.expanded).toBe(true)
   })
 
   it('addSibling inserts sibling after target', () => {
     const tree = makeTestTree()
     const newNode = createNode('Sibling of B')
     const result = addSibling(tree, 'b', newNode)
     const root = result
     const bIndex = root.children.findIndex(c => c.id === 'b')
     expect(root.children[bIndex + 1].id).toBe(newNode.id)
   })
 
   it('removeNode removes node and returns new tree', () => {
     const tree = makeTestTree()
     const result = removeNode(tree, 'a')
     expect(findNode(result, 'a')).toBeUndefined()
     expect(findNode(result, 'd')).toBeUndefined() // descendants also removed
     expect(result.children).toHaveLength(2) // b, c remain
   })
 
   it('removeNode does not remove root', () => {
     const tree = makeTestTree()
     const result = removeNode(tree, 'root')
     expect(result).toBe(tree) // returns original
   })
 
   it('updateNodeMeta updates optional fields', () => {
     const tree = makeTestTree()
     const result = updateNodeMeta(tree, 'g', { notes: 'A note', tags: ['important'] })
     const gNode = findNode(result, 'g')
     expect(gNode?.notes).toBe('A note')
     expect(gNode?.tags).toEqual(['important'])
   })
 })
 
 describe('tree-ops: indent & outdent (Tab/Shift+Tab)', () => {
   it('indent makes node a child of its previous sibling', () => {
     const tree = makeTestTree()
     const result = indent(tree, 'b') // b becomes child of a
     const aNode = findNode(result, 'a')
     expect(aNode?.children.map(c => c.id)).toContain('b')
   })
 
   it('indent does nothing if node is first child', () => {
     const tree = makeTestTree()
     const result = indent(tree, 'a') // a is first child of root
     expect(result).toBe(tree)
   })
 
   it('outdent promotes node to grandparent level after its parent', () => {
     const tree = makeTestTree()
     // d is child of a, outdent d -> becomes sibling of a after a
     const result = outdent(tree, 'd')
     const aIndex = result.children.findIndex(c => c.id === 'a')
     expect(result.children[aIndex + 1].id).toBe('d')
   })
 
   it('outdent does nothing if node is at root level', () => {
     const tree = makeTestTree()
     const result = outdent(tree, 'a')
     expect(result).toBe(tree)
   })
 
   it('indent then outdent returns to original position', () => {
     const tree = makeTestTree()
     const indented = indent(tree, 'b') // b -> child of a
     const outdented = outdent(indented, 'b') // b -> back to root level
     expect(outdented.children.map(c => c.id)).toContain('b')
     // a should not have b as child anymore
     const aNode = findNode(outdented, 'a')
     expect(aNode?.children.map(c => c.id)).not.toContain('b')
   })
 })
 
 describe('tree-ops: moveNode (drag & drop)', () => {
   it('moveNode before: moves source before target', () => {
     const tree = makeTestTree()
     const result = moveNode(tree, 'c', 'a', 'before')
     const cIndex = result.children.findIndex(c => c.id === 'c')
     const aIndex = result.children.findIndex(c => c.id === 'a')
     expect(cIndex).toBeLessThan(aIndex)
   })
 
   it('moveNode after: moves source after target', () => {
     const tree = makeTestTree()
     const result = moveNode(tree, 'a', 'c', 'after')
     const aIndex = result.children.findIndex(c => c.id === 'a')
     const cIndex = result.children.findIndex(c => c.id === 'c')
     expect(aIndex).toBeGreaterThan(cIndex)
   })
 
   it('moveNode inside: moves source as last child of target', () => {
     const tree = makeTestTree()
     const result = moveNode(tree, 'b', 'a', 'inside')
     const aNode = findNode(result, 'a')
     expect(aNode?.children.map(c => c.id)).toContain('b')
     // b should be last child
     expect(aNode?.children[aNode.children.length - 1].id).toBe('b')
   })
 
   it('moveNode prevents moving into own descendant', () => {
     const tree = makeTestTree()
     // a has descendant d; try to move a inside d
     const result = moveNode(tree, 'a', 'd', 'inside')
     expect(result).toBe(tree) // returns original
   })
 
   it('isDescendant detects descendant relationship', () => {
     const tree = makeTestTree()
     expect(isDescendant(tree, 'd')).toBe(true) // d is descendant of root
     expect(isDescendant(tree.children[0], 'd')).toBe(true) // d is descendant of a
     expect(isDescendant(tree.children[1], 'd')).toBe(false) // d is NOT descendant of b
   })
 })
 
 describe('tree-ops: expandAll & collapseAll', () => {
   it('expandAll sets all expanded to true', () => {
     const tree = makeTestTree()
     // First collapse some
     const collapsed = setExpand(tree, 'a', false)
     const expanded = expandAll(collapsed)
     walkTree(expanded, (n) => {
       expect(n.expanded).toBe(true)
     })
   })
 
   it('collapseAll sets all expanded to false', () => {
     const tree = makeTestTree()
     const collapsed = collapseAll(tree)
     walkTree(collapsed, (n) => {
       expect(n.expanded).toBe(false)
     })
   })
 })
