/**
 * 工匠AI HTML PPT 生成器
 * 将 Markdown 大纲转换为自包含的 HTML 演示文件
 * 支持：方向键翻页 / 页码指示 / 深色主题（参考 html-ppt 键盘导航规范）
 */
import { splitByH2 } from '../sage/sage-markdown';

interface PPTTheme {
  accent: string;
  bg: string;
  surface: string;
  text: string;
}

const THEME: PPTTheme = {
  accent: '#F59E0B',
  bg: '#111827',
  surface: '#1F2937',
  text: '#F3F4F6',
};

/** 转义 HTML 特殊字符 */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 将段落文本转成带样式的内容块（识别列表项） */
const renderBlock = (content: string): string => {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  // 全为列表项时渲染为要点
  const listItems = lines.filter((l) => /^[-*]\s+/.test(l));
  if (listItems.length === lines.length && listItems.length > 0) {
    return `<ul class="points">${listItems
      .map((l) => `<li>${esc(l.replace(/^[-*]\s+/, ''))}</li>`)
      .join('')}</ul>`;
  }

  return lines
    .map((l) => {
      const clean = l.replace(/^[-*]\s+/, '');
      return `<p>${esc(clean)}</p>`;
    })
    .join('');
};

/**
 * 从大纲 Markdown 生成自包含 HTML PPT
 * 每段（## 标题）为一页；无 ## 时按段落拆分
 */
export function generateHTMLPPT(title: string, markdown: string): string {
  const sections = splitByH2(markdown);
  const slides = sections.map((s) => ({
    title: s.title.replace(/^#{1,6}\s*/, '').trim(),
    body: renderBlock(s.content),
  }));

  const slideHtml = slides
    .map(
      (slide, i) => `
      <section class="slide" data-idx="${i}">
        <div class="slide-inner">
          <div class="slide-kicker">${esc(title)}</div>
          <h1>${esc(slide.title)}</h1>
          <div class="slide-body">${slide.body}</div>
        </div>
        <div class="slide-num">${i + 1} / ${slides.length}</div>
      </section>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif;
    background: ${THEME.bg};
    color: ${THEME.text};
    overflow: hidden;
  }
  .deck { height: 100vh; position: relative; }
  .slide {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; visibility: hidden;
    transition: opacity 0.4s ease, transform 0.4s ease;
    transform: translateY(20px);
    padding: 48px;
  }
  .slide.is-active { opacity: 1; visibility: visible; transform: translateY(0); }
  .slide-inner { max-width: 880px; width: 100%; }
  .slide-kicker {
    font-size: 13px; letter-spacing: 4px; text-transform: uppercase;
    color: ${THEME.accent}; margin-bottom: 18px; opacity: 0.9;
  }
  .slide h1 {
    font-size: 40px; font-weight: 700; line-height: 1.3;
    margin-bottom: 28px;
    border-left: 4px solid ${THEME.accent};
    padding-left: 20px;
  }
  .slide-body { font-size: 18px; line-height: 1.9; color: rgba(243,244,246,0.9); }
  .slide-body p { margin-bottom: 12px; }
  .points { list-style: none; }
  .points li {
    padding: 10px 16px; margin-bottom: 10px;
    background: ${THEME.surface};
    border-left: 3px solid ${THEME.accent};
    border-radius: 6px;
    font-size: 17px;
  }
  .slide-num {
    position: absolute; bottom: 28px; right: 40px;
    font-size: 14px; opacity: 0.5; letter-spacing: 2px;
  }
  .progress {
    position: absolute; top: 0; left: 0; height: 3px;
    background: ${THEME.accent};
    transition: width 0.4s ease;
  }
  .hint {
    position: absolute; bottom: 28px; left: 40px;
    font-size: 12px; opacity: 0.35; letter-spacing: 1px;
  }
  @media (max-width: 640px) {
    .slide { padding: 28px; }
    .slide h1 { font-size: 28px; }
    .slide-body { font-size: 15px; }
  }
</style>
</head>
<body>
<div class="deck">
  <div class="progress" id="progress" style="width:${100 / slides.length}%"></div>
  ${slideHtml}
  <div class="hint">← → 方向键翻页 · F 全屏</div>
</div>
<script>
(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  let idx = 0;
  function show(n) {
    idx = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    document.getElementById('progress').style.width = ((idx + 1) / slides.length * 100) + '%';
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); show(idx + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(idx - 1); }
    if (e.key === 'Home') { e.preventDefault(); show(0); }
    if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
    if (e.key.toLowerCase() === 'f') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });
  let touchX = 0;
  document.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; });
  document.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
  });
  show(0);
})();
</script>
</body>
</html>`;
}

/** 下载 HTML PPT 文件 */
export function downloadHTMLPPT(title: string, markdown: string): void {
  const html = generateHTMLPPT(title, markdown);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.ppt.html`;
  a.click();
  URL.revokeObjectURL(url);
}
