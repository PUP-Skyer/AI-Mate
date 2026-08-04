 /**
  * 节点详情面板 - 编辑备注/标签/颜色标记
  * 选中节点后侧边弹出
  */
 import React, { useState, useMemo } from 'react'
 import { Drawer, Input, Tag, ColorPicker, Space, Divider, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
 import type { SageTheme } from '../sage/sage-theme'
 import { SAGE_FONT_SERIF } from '../sage/sage-theme'
 import { useMindMapStore } from './useMindMapStore'
 import { findNode, countDescendants } from './tree-ops'
 import { getTextColor, getBorderColor, getSurfaceColor } from './mindmap-theme'
 import type { MindMapNode } from './types'

 interface NodeDetailPanelProps {
   isDark: boolean
   theme: SageTheme
   open: boolean
   onClose: () => void
 }

 const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ isDark, theme, open, onClose }) => {
   const { data, selectedId, updateMeta } = useMindMapStore()
   const [tagInput, setTagInput] = useState('')

   const node: MindMapNode | null = useMemo(() => {
     if (!data || !selectedId) return null
     return findNode(data.root, selectedId) ?? null
   }, [data, selectedId])

   const textColor = getTextColor(isDark, theme)
   const borderColor = getBorderColor(isDark, theme)
   const surfaceColor = getSurfaceColor(isDark, theme)

   const handleAddTag = () => {
     const trimmed = tagInput.trim()
     if (!trimmed || !node) return
     const currentTags = node.tags ?? []
     if (currentTags.includes(trimmed)) {
       setTagInput('')
       return
     }
     updateMeta(node.id, { tags: [...currentTags, trimmed] })
     setTagInput('')
   }

   const handleRemoveTag = (tag: string) => {
     if (!node?.tags) return
     updateMeta(node.id, { tags: node.tags.filter(t => t !== tag) })
   }

   if (!node) {
     return (
       <Drawer
         title="节点详情"
         placement="right"
         open={open}
         onClose={onClose}
         width={320}
         styles={{
           header: { background: surfaceColor, borderBottom: `1px solid ${borderColor}` },
           body: { background: surfaceColor },
         }}
       >
         <Empty description="未选中节点" />
       </Drawer>
     )
   }

   const descendantCount = countDescendants(node)

   return (
     <Drawer
       title={
         <span style={{ fontFamily: SAGE_FONT_SERIF, color: textColor }}>
           节点详情
         </span>
       }
       placement="right"
       open={open}
       onClose={onClose}
       width={340}
       styles={{
         header: { background: surfaceColor, borderBottom: `1px solid ${borderColor}` },
         body: { background: surfaceColor },
       }}
     >
       <div style={{ fontFamily: SAGE_FONT_SERIF, color: textColor }}>
         {/* 节点信息 */}
         <div style={{ marginBottom: 16 }}>
           <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>当前节点</div>
           <div style={{
             padding: '8px 12px',
             background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
             borderRadius: 6,
             fontSize: 13,
             border: `1px solid ${borderColor}`,
           }}>
             {node.text}
           </div>
           <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
             后代节点：{descendantCount} 个
           </div>
         </div>

         <Divider style={{ borderColor }} />

         {/* 颜色标记 */}
         <div style={{ marginBottom: 16 }}>
           <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>颜色标记</div>
           <Space>
             <ColorPicker
               value={node.color || theme.accentColor}
               onChange={(_, hex) => updateMeta(node.id, { color: hex })}
               showText
               format="hex"
             />
             {node.color && (
               <Tag
                 closable
                 onClose={() => updateMeta(node.id, { color: undefined })}
                 style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}
               >
                 清除颜色
               </Tag>
             )}
           </Space>
         </div>

         <Divider style={{ borderColor }} />

         {/* 标签 */}
         <div style={{ marginBottom: 16 }}>
           <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>标签</div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
             {node.tags?.map((tag) => (
               <Tag
                 key={tag}
                 closable
                 onClose={() => handleRemoveTag(tag)}
                 color={theme.accentColor}
                 style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}
               >
                 {tag}
               </Tag>
             ))}
             {!node.tags?.length && (
               <span style={{ fontSize: 12, opacity: 0.5 }}>暂无标签</span>
             )}
           </div>
           <Input
             size="small"
             placeholder="输入标签，回车添加"
             value={tagInput}
             onChange={(e) => setTagInput(e.target.value)}
             onPressEnter={handleAddTag}
             suffix={<PlusOutlined onClick={handleAddTag} style={{ cursor: 'pointer', opacity: 0.6 }} />}
             style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}
           />
         </div>

         <Divider style={{ borderColor }} />

         {/* 备注 */}
         <div style={{ marginBottom: 16 }}>
           <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>备注</div>
           <Input.TextArea
             rows={4}
             placeholder="添加备注..."
             value={node.notes ?? ''}
             onChange={(e) => updateMeta(node.id, { notes: e.target.value })}
             style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}
           />
         </div>
       </div>
     </Drawer>
   )
 }

 export default NodeDetailPanel
