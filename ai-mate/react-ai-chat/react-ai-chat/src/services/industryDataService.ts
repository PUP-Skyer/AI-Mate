/**
 * 行业数据查询服务
 * 后端 /api/industry/data（server.js 聚合接口），异常回退 mock（页面永远可用）
 */
import { authFetch } from './http';
import { mockIndustryData } from '../pages/IndustryData/data';
import type { IndustryDataResponse } from '../pages/IndustryData/types';

/** 拉取 7 大行业数据（含最后更新时间/source）；失败回退 mock */
export async function fetchIndustryData(): Promise<IndustryDataResponse> {
  try {
    const resp = await authFetch('/industry/data', {}, false); // required=false：未登录也可读
    if (resp.ok) {
      const json = await resp.json();
      if (json?.code === 200 && json?.data?.industries) {
        return json.data as IndustryDataResponse;
      }
    }
  } catch {
    /* 网络异常走 mock */
  }
  return mockIndustryData(); // mock 兜底（source: 'mock'）
}

/** 手动触发后端刷新 */
export async function triggerIndustryRefresh(): Promise<boolean> {
  try {
    const resp = await authFetch('/industry/refresh', { method: 'POST' }, false);
    return resp.ok;
  } catch {
    return false;
  }
}
