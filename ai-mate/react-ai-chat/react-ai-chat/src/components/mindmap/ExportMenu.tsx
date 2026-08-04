 /**
  * 导出菜单 - 支持 txt/md/json 格式
  * 图片导出(png) 暂为预留按钮
  */
 import React from 'react'
 import { Dropdown, Button, message } from 'antd'
 import { DownloadOutlined, FileTextOutlined, FileMarkdownOutlined, CodeOutlined } from '@ant-design/icons'
 import type { MenuProps } from 'antd'
 import { useMindMapStore } from './useMindMapStore'
 import { treeToOutline, treeToMarkdown, treeToJson } from './serialization'

 interface ExportMenuProps {
   projectName?: string
 }

 /** 触发文件下载 */
 function downloadFile(content: string, filename: string, mime: string) {
   const blob = new Blob([content], { type: mime })
   const url = URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.href = url
   a.download = filename
   a.click()
   URL.revokeObjectURL(url)
 }

 const ExportMenu: React.FC<ExportMenuProps> = ({ projectName }) => {
   const data = useMindMapStore((s) => s.data)

   const handleExport = (format: 'txt' | 'md' | 'json') => {
     if (!data) {
       message.warning('暂无思维导图数据')
       return
     }
     const name = projectName || data.projectName || '思维导图'
     switch (format) {
       case 'txt':
         downloadFile(treeToOutline(data.root), `${name}.txt`, 'text/plain')
         break
       case 'md':
         downloadFile(treeToMarkdown(data.root), `${name}.md`, 'text/markdown')
         break
       case 'json':
         downloadFile(treeToJson(data.root), `${name}.json`, 'application/json')
         break
     }
     message.success(`已导出 ${format.toUpperCase()} 文件`)
   }

   const items: MenuProps['items'] = [
     {
       key: 'txt',
       label: '大纲文本 (.txt)',
       icon: <FileTextOutlined />,
       onClick: () => handleExport('txt'),
     },
     {
       key: 'md',
       label: 'Markdown (.md)',
       icon: <FileMarkdownOutlined />,
       onClick: () => handleExport('md'),
     },
     {
       key: 'json',
       label: 'JSON (.json)',
       icon: <CodeOutlined />,
       onClick: () => handleExport('json'),
     },
   ]

   return (
     <Dropdown menu={{ items }} trigger={['click']}>
       <Button icon={<DownloadOutlined />} size="small">
         导出
       </Button>
     </Dropdown>
   )
 }

 export default ExportMenu
