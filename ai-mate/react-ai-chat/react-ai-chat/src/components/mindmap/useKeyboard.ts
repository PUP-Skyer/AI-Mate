 /**
  * 幕布风格大纲思维导图 - 键盘快捷键 hook
  * Tab=缩进, Shift+Tab=升级, Enter=同级, Delete=删除空节点
  * Ctrl+C/V/X=复制/粘贴/剪切
  */
 import { useEffect, useCallback, useRef } from 'react'
 import { useMindMapStore } from './useMindMapStore'

 interface UseKeyboardOptions {
   /** 当前编辑中的节点 id（编辑态时禁用快捷键） */
   editingId?: string | null
 }

 export function useKeyboard({ editingId }: UseKeyboardOptions = {}) {
   const selectedIdRef = useRef<string | null>(null)

   // Keep ref in sync with store
   useEffect(() => {
     const unsub = useMindMapStore.subscribe((state) => {
       selectedIdRef.current = state.selectedId
     })
     selectedIdRef.current = useMindMapStore.getState().selectedId
     return unsub
   }, [])

   const handleKeyDown = useCallback((e: KeyboardEvent) => {
     // Skip if editing text
     if (editingId) return
     // Skip if target is an input/textarea
     const target = e.target as HTMLElement
     if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

     const selectedId = selectedIdRef.current
     if (!selectedId) return

     const store = useMindMapStore.getState()
     const isMac = navigator.platform.includes('Mac')
     const ctrl = isMac ? e.metaKey : e.ctrlKey

     // Tab: indent
     if (e.key === 'Tab' && !e.shiftKey) {
       e.preventDefault()
       store.indentNode(selectedId)
       return
     }

     // Shift+Tab: outdent
     if (e.key === 'Tab' && e.shiftKey) {
       e.preventDefault()
       store.outdentNode(selectedId)
       return
     }

     // Enter: add sibling
     if (e.key === 'Enter' && !ctrl) {
       e.preventDefault()
       store.addSiblingNode(selectedId)
       return
     }

     // Delete/Backspace: remove if empty text (or always for Delete)
     if (e.key === 'Delete') {
       e.preventDefault()
       store.removeNodeById(selectedId)
       return
     }

     // Ctrl+C: copy
     if (ctrl && e.key === 'c' && !e.shiftKey) {
       // Don't preventDefault - allow native copy too
       store.copy(selectedId)
       return
     }

     // Ctrl+V: paste as child
     if (ctrl && e.key === 'v' && !e.shiftKey) {
       e.preventDefault()
       store.paste(selectedId, 'child')
       return
     }

     // Ctrl+X: cut
     if (ctrl && e.key === 'x' && !e.shiftKey) {
       e.preventDefault()
       store.cut(selectedId)
       return
     }
   }, [editingId])

   useEffect(() => {
     window.addEventListener('keydown', handleKeyDown)
     return () => window.removeEventListener('keydown', handleKeyDown)
   }, [handleKeyDown])
 }
