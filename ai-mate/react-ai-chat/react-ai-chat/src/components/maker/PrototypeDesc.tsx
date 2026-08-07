/**
 * 工匠AI - 原型描述面板（案四 · 紫罗兰）
 * 圆角毛玻璃卡片列表：序号 + 图片 + 加粗可编辑描述
 * 点击加号持续追加，支持图片上传和内联编辑，数据持久化
 */

 import React, { useState, useEffect, useCallback } from 'react';
 import { Button, Input, Upload, Empty, Tooltip, Space, Typography, message } from 'antd';
 import {
   PlusOutlined,
   EditOutlined,
   CheckOutlined,
   CloseOutlined,
   DeleteOutlined,
   PictureOutlined,
   DownloadOutlined,
 } from '@ant-design/icons';
 import { useAIStore } from '../../store/aiStore';
 import { MAKER_THEMES, MAKER_FONT_SERIF, type MakerTheme } from './maker-theme';
 import './maker-animations.css';
import { MakerSection } from './shared';
 import {
   loadProtoCards,
   saveProtoCards,
   type ProtoCard,
 } from './proto-storage';

const { Text } = Typography;

 /** 生成唯一 id */
 const generateId = (): string =>
   `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
 
 /** 文件转 base64 Data URL */
 const fileToBase64 = (file: File): Promise<string> =>
   new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.onload = () => resolve(reader.result as string);
     reader.onerror = reject;
     reader.readAsDataURL(file);
   });
 
 // ─── 单个毛玻璃卡片组件 ──────────────────────────────────
 
 interface ProtoCardItemProps {
   card: ProtoCard;
   index: number;
   isDark: boolean;
   mTheme: MakerTheme;
   editing: boolean;
   draftText: string;
   onDraftChange: (v: string) => void;
   onImageUpload: (id: string, file: File) => void;
   onStartEdit: (card: ProtoCard) => void;
   onSaveEdit: (id: string) => void;
   onCancelEdit: () => void;
   onDelete: (id: string) => void;
 }
 
 const ProtoCardItem: React.FC<ProtoCardItemProps> = ({
   card,
   index,
   isDark,
   mTheme,
   editing,
   draftText,
   onDraftChange,
   onImageUpload,
   onStartEdit,
   onSaveEdit,
   onCancelEdit,
   onDelete,
 }) => {
   const textColor = isDark ? mTheme.textDark : mTheme.textLight;
   const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;
 
   return (
     <div
       className={`maker-fade-in-up maker-stagger-${Math.min(index + 1, 9)}`}
       style={{
         display: 'flex',
         gap: 16,
         borderRadius: 16,
         padding: 16,
         background: isDark
           ? 'rgba(31, 41, 55, 0.65)'
           : 'rgba(255, 255, 255, 0.75)',
         backdropFilter: 'blur(15px)',
         WebkitBackdropFilter: 'blur(15px)',
         border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.15)'}`,
         boxShadow: `0 4px 16px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(124,58,237,0.08)'}`,
       }}
     >
       {/* 序号徽章 */}
       <div
         style={{
           width: 36,
           height: 36,
           borderRadius: 8,
           flexShrink: 0,
           background: mTheme.accentColor,
           color: '#fff',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           fontFamily: MAKER_FONT_SERIF,
           fontSize: 14,
           fontWeight: 700,
           boxShadow: `0 0 8px ${mTheme.glowColor}`,
         }}
       >
         {index + 1}
       </div>
 
       {/* 图片区域 */}
       <div style={{ width: 160, flexShrink: 0 }}>
         {card.image ? (
           <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
             <img
               src={card.image}
               alt={`卡片 ${index + 1}`}
               style={{ width: '100%', display: 'block', borderRadius: 8 }}
             />
             <Upload
               accept="image/*"
               showUploadList={false}
               beforeUpload={(file) => {
                 onImageUpload(card.id, file);
                 return false;
               }}
             >
               <Tooltip title="替换图片">
                 <Button
                   size="small"
                   icon={<PictureOutlined />}
                   style={{ position: 'absolute', top: 6, right: 6, opacity: 0.85 }}
                 />
               </Tooltip>
             </Upload>
           </div>
         ) : (
           <Upload
             accept="image/*"
             showUploadList={false}
             beforeUpload={(file) => {
               onImageUpload(card.id, file);
               return false;
             }}
           >
             <div
               style={{
                 width: '100%',
                 height: 120,
                 borderRadius: 8,
                 border: `2px dashed ${borderColor}`,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 cursor: 'pointer',
                 gap: 6,
                 color: mTheme.accentColor,
                 opacity: 0.7,
                 transition: 'opacity 0.2s',
               }}
               onMouseEnter={(e) => {
                 (e.currentTarget as HTMLDivElement).style.opacity = '1';
               }}
               onMouseLeave={(e) => {
                 (e.currentTarget as HTMLDivElement).style.opacity = '0.7';
               }}
             >
               <PictureOutlined style={{ fontSize: 24 }} />
               <span style={{ fontSize: 11, fontFamily: MAKER_FONT_SERIF }}>上传图片</span>
             </div>
           </Upload>
         )}
       </div>
 
       {/* 描述区域 */}
       <div style={{ flex: 1, minWidth: 0 }}>
         {editing ? (
           <div>
             <Input.TextArea
               value={draftText}
               onChange={(e) => onDraftChange(e.target.value)}
               autoFocus
               rows={4}
               placeholder="输入卡片描述..."
               style={{
                 fontFamily: MAKER_FONT_SERIF,
                 fontWeight: 700,
                 borderRadius: 8,
               }}
             />
             <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
               <Button
                 size="small"
                 type="primary"
                 icon={<CheckOutlined />}
                 onClick={() => onSaveEdit(card.id)}
                 style={{ background: mTheme.sealColor, border: 'none' }}
               >
                 保存
               </Button>
               <Button size="small" icon={<CloseOutlined />} onClick={onCancelEdit}>
                 取消
               </Button>
             </div>
           </div>
         ) : (
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div
               onDoubleClick={() => onStartEdit(card)}
               style={{
                 fontFamily: MAKER_FONT_SERIF,
                 fontWeight: 700,
                 fontSize: 14,
                 color: textColor,
                 lineHeight: 1.7,
                 flex: 1,
                 cursor: 'text',
                 minHeight: 40,
                 whiteSpace: 'pre-wrap',
                 opacity: card.description ? 1 : 0.4,
               }}
             >
               {card.description || '双击或点击编辑按钮添加描述...'}
             </div>
             <Space size={4} style={{ flexShrink: 0, marginLeft: 8 }}>
               <Tooltip title="编辑">
                 <Button
                   size="small"
                   type="text"
                   icon={<EditOutlined />}
                   onClick={() => onStartEdit(card)}
                 />
               </Tooltip>
               <Tooltip title="删除">
                 <Button
                   size="small"
                   type="text"
                   danger
                   icon={<DeleteOutlined />}
                   onClick={() => onDelete(card.id)}
                 />
               </Tooltip>
             </Space>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 // ─── 主组件 ──────────────────────────────────────────────
 
 const PrototypeDesc: React.FC = () => {
   const isDark = useAIStore((s) => s.settings.theme === 'dark');
   const mTheme: MakerTheme = MAKER_THEMES.proto;
   const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;
 
  const [cards, setCards] = useState<ProtoCard[]>(() => {
    try {
      return loadProtoCards().cards;
    } catch {
      return [];
    }
  });
   const [editingId, setEditingId] = useState<string | null>(null);
   const [draftText, setDraftText] = useState('');
 
   // 持久化：cards 变化时防抖保存
   useEffect(() => {
     const timer = setTimeout(() => {
       try {
         saveProtoCards({ cards, updatedAt: Date.now() });
       } catch {
         message.warning('数据量过大，部分内容可能未保存');
       }
     }, 400);
     return () => clearTimeout(timer);
  }, [cards]);
 
   const handleAdd = useCallback(() => {
     const newCard: ProtoCard = {
       id: generateId(),
       order: cards.length + 1,
       image: '',
       description: '',
       updatedAt: Date.now(),
     };
     setCards((prev) => [...prev, newCard]);
     setEditingId(newCard.id);
     setDraftText('');
   }, [cards.length]);
 
   const handleImageUpload = useCallback(async (cardId: string, file: File) => {
     try {
       const base64 = await fileToBase64(file);
       setCards((prev) =>
         prev.map((c) =>
           c.id === cardId ? { ...c, image: base64, updatedAt: Date.now() } : c
         )
       );
     } catch {
       message.error('图片上传失败');
     }
   }, []);
 
   const handleStartEdit = useCallback((card: ProtoCard) => {
     setEditingId(card.id);
     setDraftText(card.description);
   }, []);
 
   const handleSaveEdit = useCallback((cardId: string) => {
     setCards((prev) =>
       prev.map((c) =>
         c.id === cardId ? { ...c, description: draftText, updatedAt: Date.now() } : c
       )
     );
     setEditingId(null);
   }, [draftText]);
 
   const handleCancelEdit = useCallback(() => {
     setEditingId(null);
   }, []);
 
   const handleDelete = useCallback((cardId: string) => {
     setCards((prev) =>
       prev
         .filter((c) => c.id !== cardId)
         .map((c, i) => ({ ...c, order: i + 1 }))
     );
     setEditingId((prev) => (prev === cardId ? null : prev));
   }, []);
 
   const handleExport = useCallback(() => {
     const md = cards
       .map((c, i) => {
         const imgLine = c.image ? `[图片]` : '(无图片)';
         return `## ${i + 1}. ${c.description || '(无描述)'}\n\n${imgLine}\n`;
       })
       .join('\n');
     const blob = new Blob([md], { type: 'text/markdown' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = '原型描述.md';
     a.click();
     URL.revokeObjectURL(url);
   }, [cards]);
 
   return (
     <div
       className="maker-grid-bg maker-paper-noise"
       style={{
         padding: 16,
         background: isDark ? mTheme.bgDark : mTheme.bgLight,
         borderRadius: 12,
         minHeight: '100%',
         '--maker-grid-line': isDark ? mTheme.glowColor : 'rgba(124,58,237,0.05)',
       } as React.CSSProperties}
     >
       {/* 面板头部：案号徽章 + 标题 */}
       <div
         className="maker-fade-in-up"
         style={{
           display: 'flex',
           alignItems: 'center',
           gap: 12,
           padding: '14px 18px',
           borderRadius: 12,
           background: isDark ? mTheme.gradient : mTheme.gradientLight,
           marginBottom: 16,
           border: `1px solid ${borderColor}`,
         }}
       >
         <div
           style={{
             width: 44,
             height: 44,
             borderRadius: 8,
             background: mTheme.sealColor,
             color: '#fff',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontFamily: MAKER_FONT_SERIF,
             fontSize: 14,
             fontWeight: 700,
             letterSpacing: 2,
             boxShadow: `0 0 12px ${mTheme.glowColor}`,
             flexShrink: 0,
           }}
         >
           {mTheme.caseNo}
         </div>
         <div>
           <div
             style={{
               fontFamily: MAKER_FONT_SERIF,
               fontSize: 18,
               fontWeight: 700,
               color: isDark ? mTheme.textDark : mTheme.textLight,
               letterSpacing: 2,
             }}
           >
             {mTheme.title}
           </div>
           <div
             style={{
               fontFamily: MAKER_FONT_SERIF,
               fontSize: 11,
               color: mTheme.accentColor,
               letterSpacing: 3,
               opacity: 0.85,
             }}
           >
             PROTOTYPE CARDS
           </div>
         </div>
       </div>
 
       {/* 卡片列表分区 */}
       <MakerSection title="页面描述" subtitle="PAGE CARDS" theme={mTheme} isDark={isDark} stagger={2}>
         {cards.length === 0 ? (
           <Empty
             description="暂无卡片，点击下方加号添加"
             style={{ padding: 40 }}
           />
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {cards.map((card, i) => (
               <ProtoCardItem
                 key={card.id}
                 card={card}
                 index={i}
                 isDark={isDark}
                 mTheme={mTheme}
                 editing={editingId === card.id}
                 draftText={draftText}
                 onDraftChange={setDraftText}
                 onImageUpload={handleImageUpload}
                 onStartEdit={handleStartEdit}
                 onSaveEdit={handleSaveEdit}
                 onCancelEdit={handleCancelEdit}
                 onDelete={handleDelete}
               />
             ))}
           </div>
         )}
 
         {/* 底部操作区 */}
         <div
           style={{
             display: 'flex',
             justifyContent: 'center',
             marginTop: 16,
             gap: 12,
           }}
         >
           <Button
             type="dashed"
             icon={<PlusOutlined />}
             onClick={handleAdd}
             className="maker-seal-btn"
             style={{
               borderColor: mTheme.accentColor,
               color: mTheme.accentColor,
               fontFamily: MAKER_FONT_SERIF,
               borderRadius: 8,
               height: 40,
               paddingLeft: 24,
               paddingRight: 24,
             }}
           >
             添加卡片
           </Button>
           {cards.length > 0 && (
             <Button
               icon={<DownloadOutlined />}
               onClick={handleExport}
               size="small"
               style={{
                 color: mTheme.accentColor,
                 fontFamily: MAKER_FONT_SERIF,
                 fontSize: 12,
               }}
             >
               导出描述
             </Button>
           )}
         </div>
       </MakerSection>
 
       {/* 提示 */}
       {cards.length === 0 && (
         <div style={{ textAlign: 'center', marginTop: 12 }}>
           <Text
             type="secondary"
             style={{ fontSize: 12, fontFamily: MAKER_FONT_SERIF }}
           >
             点击"添加卡片"创建圆角毛玻璃卡片，可上传功能截图并编辑描述
           </Text>
         </div>
       )}
     </div>
   );
 };

export default PrototypeDesc;
