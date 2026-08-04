/**
 * AI API - 调用 AI 代理层生成 BP 内容
 */

interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AiRequestBody {
  messages: AiMessage[];
  system_prompt?: string;
  stream?: boolean;
}

/**
 * 非流式调用 AI 生成 BP 内容
 */
export async function generateBPContent(
  section: string,
  context: string,
  token?: string
): Promise<string> {
  const messages: AiMessage[] = [
    {
      role: 'user',
      content: `请为商业计划书的"${section}"章节生成内容。\n\n背景信息：${context}`,
    },
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/ai/zhipu', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      system_prompt:
        '你是商业计划书撰写专家，请根据提供的信息生成专业、详实的商业计划书章节内容。',
      stream: false,
    } as AiRequestBody),
  });

  if (!res.ok) {
    throw new Error(`AI 生成失败: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * SSE 流式调用 AI 生成 BP 内容
 */
export async function generateBPContentStream(
  section: string,
  context: string,
  onChunk: (text: string) => void,
  token?: string
): Promise<string> {
  const messages: AiMessage[] = [
    {
      role: 'user',
      content: `请为商业计划书的"${section}"章节生成内容。\n\n背景信息：${context}`,
    },
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/ai/zhipu', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      system_prompt:
        '你是商业计划书撰写专家，请根据提供的信息生成专业、详实的商业计划书章节内容。',
      stream: true,
    } as AiRequestBody),
  });

  if (!res.ok) {
    throw new Error(`AI 生成失败: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          onChunk(fullContent);
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  }

  return fullContent;
}
