 /**
  * 工匠AI - 原型Demo数据持久化
  * localStorage 键值对存储，遵循 sage-storage.ts 模式
  */

 /** 平台类型 */
 export type PlatformType = 'web' | 'app' | 'miniapp' | 'desktop' | 'other';

 /** Demo 项目数据 */
 export interface DemoProjectData {
   id: number;
   title: string;
   description: string;
   stage: string;
   team_type: 'OPC' | 'OTC';
   team_members?: string;
   platform: PlatformType;
   preview_url?: string;
   /** base64 视频 Data URL（用户上传） */
   demo_video_data?: string;
   /** 外部视频链接（备选） */
   demo_video_url?: string;
   cover_image?: string;
   github_url?: string;
   gitee_url?: string;
   douyin_url?: string;
   bilibili_url?: string;
   x_url?: string;
   xiaohongshu_url?: string;
 }

 /** Demo 集合 */
 export interface DemoCollection {
   demos: DemoProjectData[];
   updatedAt: number;
 }

 /** localStorage key */
 export const MAKER_DEMO_KEY = 'ai-mate-maker-demos';

 /** 读取 Demo 数据；不存在或损坏返回 null */
 export function loadDemos(): DemoCollection | null {
   try {
     const raw = localStorage.getItem(MAKER_DEMO_KEY);
     if (!raw) return null;
     const parsed = JSON.parse(raw) as DemoCollection;
     if (!parsed || !Array.isArray(parsed.demos)) return null;
     return parsed;
   } catch {
     return null;
   }
 }

 /** 保存 Demo 数据（静默失败） */
 export function saveDemos(data: DemoCollection): void {
   try {
     localStorage.setItem(MAKER_DEMO_KEY, JSON.stringify(data));
   } catch {
     // localStorage 不可用或超限时静默失败
   }
 }
