/**
 * i18n 基础设施（轻量自研）
 * - useI18n() 钩子：订阅 zustand settings.language，切换即全量重渲染
 * - t(key, params)：{{var}} 插值；缺失回退 zh-CN，再回退 key 本身
 * - getT(lang)：非组件场景
 */
import { useAIStore } from '../store/aiStore';
import { zhCN } from './locales/zh-CN';
import { en } from './locales/en';

export type Language = 'zh-CN' | 'en';
export type Messages = Record<string, string>;

const LOCALES: Record<Language, Messages> = {
  'zh-CN': zhCN as Messages,
  en: en as Messages,
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

export function getT(lang: Language): (key: string, params?: Record<string, string | number>) => string {
  return (key, params) => {
    const messages = LOCALES[lang] || zhCN;
    let text = messages[key];
    if (text === undefined) {
      text = (zhCN as Messages)[key]; // 回退中文
    }
    if (text === undefined) {
      return key; // 最后回退 key
    }
    return interpolate(text, params);
  };
}

/** React 钩子：返回当前语言与翻译函数 */
export function useI18n() {
  const lang = useAIStore((s) => s.settings.language as Language);
  return { lang, t: getT(lang) };
}

/** 同步 document 语言与标题（跟随设置切换） */
export function setDocumentLang(lang: Language) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
}
