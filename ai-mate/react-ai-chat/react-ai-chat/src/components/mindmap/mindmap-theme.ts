 /**
  * 思维导图主题配色
  * 复用 SageTheme 颜色体系，提供思维导图节点配色映射
  */
 import type { SageTheme } from '../sage/sage-theme'

 /** 思维导图节点配色方案（按深度循环取色） */
 export function getNodeColor(depth: number, theme: SageTheme): string {
   const colors = theme.chartColors
   return colors[depth % colors.length]
 }
 
 /** 节点背景色（带透明度） */
 export function getNodeBg(depth: number, theme: SageTheme): string {
   return `${getNodeColor(depth, theme)}14`
 }
 
 /** 节点边框色 */
 export function getNodeBorder(depth: number, theme: SageTheme): string {
   return `${getNodeColor(depth, theme)}66`
 }
 
 /** 连线颜色（父节点色淡化） */
 export function getLinkColor(depth: number, theme: SageTheme): string {
   return `${getNodeColor(depth, theme)}55`
 }
 
 /** 获取主题文本色 */
 export function getTextColor(isDark: boolean, theme: SageTheme): string {
   return isDark ? theme.textDark : theme.textLight
 }
 
 /** 获取主题背景色 */
 export function getBgColor(isDark: boolean, theme: SageTheme): string {
   return isDark ? theme.bgDark : theme.bgLight
 }
 
 /** 获取主题边框色 */
 export function getBorderColor(isDark: boolean, theme: SageTheme): string {
   return isDark ? theme.borderDark : theme.borderLight
 }
 
 /** 获取主题卡片色 */
 export function getSurfaceColor(isDark: boolean, theme: SageTheme): string {
   return isDark ? theme.surfaceDark : theme.surfaceLight
 }
