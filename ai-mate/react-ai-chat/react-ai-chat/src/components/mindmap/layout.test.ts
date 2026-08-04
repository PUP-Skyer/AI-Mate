 import { describe, it, expect } from 'vitest'
import { computeLayout, getLayoutSize, getBezierPath } from './layout'
 import type { MindMapNode } from './types'
 
 function makeNode(id: string, text: string, children: MindMapNode[] = [], expanded = true): MindMapNode {
   return { id, text, children, expanded }
 }
 
 describe('layout: computeLayout', () => {
   it('computes layout for single node', () => {
     const tree = makeNode('root', 'Root')
     const layout = computeLayout(tree)
     expect(layout).toHaveLength(1)
     expect(layout[0].id).toBe('root')
     expect(layout[0].depth).toBe(0)
     expect(layout[0].parentId).toBeNull()
   })
 
   it('computes layout for tree with children', () => {
     const tree = makeNode('root', 'Root', [
       makeNode('a', 'A'),
       makeNode('b', 'B'),
     ])
     const layout = computeLayout(tree)
     expect(layout).toHaveLength(3)
     const aNode = layout.find(n => n.id === 'a')!
     const bNode = layout.find(n => n.id === 'b')!
     // Children should be at depth 1
     expect(aNode.depth).toBe(1)
     expect(bNode.depth).toBe(1)
     // Children x should be greater than root x
     const rootNode = layout.find(n => n.id === 'root')!
     expect(aNode.x).toBeGreaterThan(rootNode.x)
     expect(bNode.x).toBeGreaterThan(rootNode.x)
     // b should be below a
     expect(bNode.y).toBeGreaterThan(aNode.y)
   })
 
   it('does not layout collapsed children', () => {
     const tree = makeNode('root', 'Root', [
       makeNode('a', 'A'),
     ], false) // collapsed
     const layout = computeLayout(tree)
     expect(layout).toHaveLength(1) // only root
   })
 
   it('computes deep nested layout', () => {
     const tree = makeNode('root', 'Root', [
       makeNode('a', 'A', [
         makeNode('a1', 'A1', [
           makeNode('a1x', 'A1X'),
         ]),
       ]),
     ])
     const layout = computeLayout(tree)
     expect(layout).toHaveLength(4)
     const a1xNode = layout.find(n => n.id === 'a1x')!
     expect(a1xNode.depth).toBe(3)
   })
 
   it('nodes do not overlap vertically', () => {
     const tree = makeNode('root', 'Root', [
       makeNode('a', 'A'),
       makeNode('b', 'B'),
       makeNode('c', 'C'),
     ])
     const layout = computeLayout(tree)
     const aY = layout.find(n => n.id === 'a')!.y
     const bY = layout.find(n => n.id === 'b')!.y
     const cY = layout.find(n => n.id === 'c')!.y
     expect(bY).toBeGreaterThan(aY)
     expect(cY).toBeGreaterThan(bY)
   })
 })
 
 describe('layout: getLayoutSize', () => {
   it('returns default size for empty layout', () => {
     const size = getLayoutSize([])
     expect(size.width).toBeGreaterThanOrEqual(400)
     expect(size.height).toBeGreaterThanOrEqual(300)
   })
 
   it('returns size covering all nodes', () => {
     const tree = makeNode('root', 'Root', [makeNode('a', 'A')])
     const layout = computeLayout(tree)
     const size = getLayoutSize(layout)
     const maxNodeX = Math.max(...layout.map(n => n.x + n.width))
     const maxNodeY = Math.max(...layout.map(n => n.y + n.height))
     expect(size.width).toBeGreaterThanOrEqual(maxNodeX)
     expect(size.height).toBeGreaterThanOrEqual(maxNodeY)
   })
 })
 
 describe('layout: getBezierPath', () => {
   it('generates valid SVG path string', () => {
     const path = getBezierPath(0, 0, 100, 100)
     expect(path).toContain('M 0 0')
     expect(path).toContain('C ')
   })
 })
