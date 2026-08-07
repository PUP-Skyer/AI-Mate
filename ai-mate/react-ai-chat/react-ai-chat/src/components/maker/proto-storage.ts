 /**
  * 工匠AI - 原型描述卡片持久化
  * localStorage 键值对存储，遵循 sage-storage.ts 模式
  */

 /** 原型描述卡片 */
 export interface ProtoCard {
   /** 唯一标识 */
   id: string;
   /** 序号（1-based，删除后重排） */
   order: number;
   /** 图片 base64 Data URL，空字符串表示无图 */
   image: string;
   /** 加粗可编辑描述文本 */
   description: string;
   /** 创建/更新时间戳 */
   updatedAt: number;
 }

 /** 原型描述卡片集合 */
 export interface ProtoCardCollection {
   cards: ProtoCard[];
   updatedAt: number;
 }

 /** localStorage key */
 export const MAKER_PROTO_KEY = 'ai-mate-maker-proto-cards';

 /** 读取原型描述卡片；不存在或损坏返回空集合 */
 export function loadProtoCards(): ProtoCardCollection {
   try {
     const raw = localStorage.getItem(MAKER_PROTO_KEY);
     if (!raw) return { cards: [], updatedAt: 0 };
     const parsed = JSON.parse(raw) as ProtoCardCollection;
     if (!parsed || !Array.isArray(parsed.cards)) return { cards: [], updatedAt: 0 };
     return parsed;
   } catch {
     return { cards: [], updatedAt: 0 };
   }
 }

 /** 保存原型描述卡片（静默失败） */
 export function saveProtoCards(data: ProtoCardCollection): void {
   try {
     localStorage.setItem(MAKER_PROTO_KEY, JSON.stringify(data));
   } catch {
     // localStorage 不可用或超限时静默失败
   }
 }
