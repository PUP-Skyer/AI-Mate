import { describe, it, expect, beforeEach } from 'vitest'
import { useMindMapStore } from './useMindMapStore'
 
 describe('useMindMapStore', () => {
   beforeEach(() => {
     // Reset store to empty state
     localStorage.clear()
     useMindMapStore.setState({
       data: null,
       layoutMode: 'split',
       clipboard: null,
       selectedId: null,
       searchQuery: '',
       showCheckbox: false,
     })
   })
 
   it('newMap creates empty mindmap data', () => {
     useMindMapStore.getState().newMap('测试项目')
     const { data } = useMindMapStore.getState()
     expect(data?.projectName).toBe('测试项目')
     expect(data?.root.text).toBe('测试项目')
     expect(data?.root.children).toHaveLength(0)
   })
 
   it('addChildNode adds a child and selects it', () => {
     useMindMapStore.getState().newMap('Test')
     const root = useMindMapStore.getState().data!.root
     useMindMapStore.getState().addChildNode(root.id)
     const { data, selectedId } = useMindMapStore.getState()
     expect(data?.root.children).toHaveLength(1)
     expect(selectedId).toBe(data!.root.children[0].id)
   })
 
   it('setText updates node text', () => {
     useMindMapStore.getState().newMap('Test')
     const root = useMindMapStore.getState().data!.root
     useMindMapStore.getState().addChildNode(root.id)
     const childId = useMindMapStore.getState().data!.root.children[0].id
     useMindMapStore.getState().setText(childId, 'Updated Text')
     const node = useMindMapStore.getState().data!.root.children[0]
     expect(node.text).toBe('Updated Text')
   })
 
   it('removeNodeById removes node', () => {
     useMindMapStore.getState().newMap('Test')
     const root = useMindMapStore.getState().data!.root
     useMindMapStore.getState().addChildNode(root.id)
     const childId = useMindMapStore.getState().data!.root.children[0].id
     useMindMapStore.getState().removeNodeById(childId)
     expect(useMindMapStore.getState().data!.root.children).toHaveLength(0)
   })
 
   it('indent/outdent changes hierarchy', () => {
     useMindMapStore.getState().newMap('Test')
     const root = useMindMapStore.getState().data!.root
     useMindMapStore.getState().addChildNode(root.id)
     useMindMapStore.getState().addChildNode(root.id)
     // Now root has [a, b]
     const bId = useMindMapStore.getState().data!.root.children[1].id
     // Indent b -> becomes child of a
     useMindMapStore.getState().indentNode(bId)
     const aNode = useMindMapStore.getState().data!.root.children[0]
     expect(aNode.children[0].id).toBe(bId)
     // Outdent b -> back to root level
     useMindMapStore.getState().outdentNode(bId)
     expect(useMindMapStore.getState().data!.root.children).toHaveLength(2)
   })
 
   it('copy/paste duplicates subtree', () => {
     useMindMapStore.getState().newMap('Test')
     const root = useMindMapStore.getState().data!.root
     useMindMapStore.getState().addChildNode(root.id)
     const aId = useMindMapStore.getState().data!.root.children[0].id
     // Add grandchild
     useMindMapStore.getState().addChildNode(aId)
     // Copy a
     useMindMapStore.getState().copy(aId)
     // Paste as child of root
     useMindMapStore.getState().paste(root.id, 'child')
     const data = useMindMapStore.getState().data!
     expect(data.root.children).toHaveLength(2)
     // The pasted child should have a grandchild too
     expect(data.root.children[1].children).toHaveLength(1)
   })
 
   it('layoutMode can be set', () => {
     useMindMapStore.getState().setLayoutMode('outline')
     expect(useMindMapStore.getState().layoutMode).toBe('outline')
   })
 
   it('persists to localStorage', () => {
     useMindMapStore.getState().newMap('持久化测试')
     const raw = localStorage.getItem('ai-mate-sage-mindmap')
     expect(raw).toBeTruthy()
     const parsed = JSON.parse(raw!)
     expect(parsed.projectName).toBe('持久化测试')
   })
 })
