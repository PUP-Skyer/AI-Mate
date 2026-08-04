/**
 * 行业数据聚合模块
 * 数据存 data/industry_data.json（参照 memory.json 先例）
 * refreshIndustryData(): 定时抓取 7 大行业最新报告（复用 web-search 的搜狗/Bing 正则解析），失败 mock 兜底
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'industry_data.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// 7 大行业 mock 基准（指标为聚合估算值；与前端 data.ts 同源）
const INDUSTRY_NAMES = ['人工智能', '新能源', '智慧餐饮', '智能制造', '生物医药', '金融科技', '跨境电商'];
const COLORS = { 人工智能: '#1677ff', 新能源: '#52c41a', 智慧餐饮: '#fa8c16', 智能制造: '#722ed1', 生物医药: '#eb2f96', 金融科技: '#13c2c2', 跨境电商: '#faad14' };

function mockIndustry(name) {
  const base = {
    人工智能: { marketSize: '1.2万亿', growthRate: 28.5, reportCount: 4523, hotIndex: 92, series: [8600, 10400, 12800] },
    新能源: { marketSize: '8600亿', growthRate: 24.2, reportCount: 2891, hotIndex: 86, series: [6100, 7400, 8600] },
    智慧餐饮: { marketSize: '4200亿', growthRate: 19.6, reportCount: 1547, hotIndex: 71, series: [2900, 3600, 4200] },
    智能制造: { marketSize: '3.4万亿', growthRate: 12.8, reportCount: 1328, hotIndex: 78, series: [27000, 30500, 34000] },
    生物医药: { marketSize: '9800亿', growthRate: 9.4, reportCount: 1184, hotIndex: 64, series: [8200, 8900, 9800] },
    金融科技: { marketSize: '5600亿', growthRate: 15.7, reportCount: 1026, hotIndex: 81, series: [4000, 4800, 5600] },
    跨境电商: { marketSize: '3.1万亿', growthRate: 18.9, reportCount: 348, hotIndex: 69, series: [23000, 27000, 31000] },
  }[name];
  return {
    industry: name,
    color: COLORS[name],
    marketSize: base.marketSize,
    growthRate: base.growthRate,
    reportCount: base.reportCount,
    hotIndex: base.hotIndex,
    dataPoints: { 前年: base.series[0], 去年: base.series[1], 今年: base.series[2] },
    charts: [
      { kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: base.series }] },
    ],
    reports: [
      { id: `ID-${name}-1`, title: `${name}行业 2026 年度发展报告（示例）`, institution: '行业研究机构', publishedAt: '2026-07-30', url: '#' },
    ],
    sources: ['mock 基准数据'],
  };
}

function defaultState() {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'initial',
    source: 'mock',
    industries: INDUSTRY_NAMES.map(mockIndustry),
  };
}

export function loadIndustryData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (parsed && Array.isArray(parsed.industries) && parsed.industries.length === INDUSTRY_NAMES.length) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('加载行业数据失败:', err.message);
  }
  const state = defaultState();
  saveIndustryData(state);
  return state;
}

function saveIndustryData(state) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('保存行业数据失败:', err.message);
  }
}

/** HTML 转纯文本（与 server.js htmlToText 同思路的轻量实现） */
function htmlToText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/** 解析搜狗结果（复用 web-search 先例的精简版） */
function parseSogou(html, max) {
  const results = [];
  const blocks = html.split(/<div class="vrwrap"/i).slice(1);
  for (const block of blocks) {
    if (results.length >= max) break;
    const h3 = /<h3 class="vr-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!h3) continue;
    let url = h3[1];
    const linkM = /\/link\?url=([A-Za-z0-9_\-]+)/.exec(url);
    if (linkM) {
      try {
        let b64 = linkM[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        if (/^https?:\/\//i.test(decoded)) url = decoded;
      } catch { /* 保留原链接 */ }
    }
    const snip = /<p class="star-wiki[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block)
      || /<div class="text-layout[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
    results.push({ title: htmlToText(h3[2]).slice(0, 80), url, snippet: snip ? htmlToText(snip[1]).slice(0, 120) : '' });
  }
  return results;
}

/** 抓取单行业最新报告（真实数据源；失败抛出） */
async function fetchIndustryReports(industry) {
  const query = `${industry} 行业报告 2026 市场规模`;
  const res = await fetch(`https://www.sogou.com/web?query=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseSogou(await res.text(), 6);
}

/** 定时刷新入口：逐行业抓取，整体失败标记 mock（数据永远可用） */
export async function refreshIndustryData() {
  let fetchedAny = false;
  for (const ind of state.industries) {
    try {
      const reports = await fetchIndustryReports(ind.industry);
      if (reports && reports.length > 0) {
        ind.reports = reports.map((r, i) => ({
          id: `ID-${ind.industry}-${Date.now()}-${i}`,
          title: r.title,
          institution: ind.industry,
          publishedAt: new Date().toISOString().slice(0, 10),
          url: r.url,
        }));
        ind.sources = ['公开搜索聚合'];
        fetchedAny = true;
      }
    } catch { /* 单行业失败保留旧数据，继续下一个 */ }
  }
  state.lastUpdated = new Date().toISOString();
  state.updatedBy = fetchedAny ? 'auto-refresh' : 'mock-fallback';
  state.source = fetchedAny ? 'fetched' : 'mock';
  saveIndustryData(state);
  return state;
}

export function getIndustryState() { return state; }

const state = loadIndustryData();
