// assets/charts.js — 青宸智汇参赛方案图表
(function () {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var fontFamily =
    "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC','WenQuanYi Micro Hei',sans-serif";

  // --- Chart: 三大赛道匹配度 ---
  var chartTrack = document.getElementById('chart-track');
  if (chartTrack) {
    var trackChart = echarts.init(chartTrack, null, { renderer: 'svg' });
    trackChart.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        appendToBody: true,
        formatter: function (params) {
          var p = params[0];
          return (
            '<b>' + p.name + '</b><br/>匹配度：' + p.value + ' / 100'
          );
        }
      },
      grid: { left: 8, right: 56, top: 12, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: muted, fontFamily: fontFamily },
        splitLine: { lineStyle: { color: rule } },
        axisLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'category',
        data: ['乡村振兴赛道', '消费创新赛道', '科技创新赛道'],
        axisLabel: { color: ink, fontFamily: fontFamily, fontSize: 13 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      series: [
        {
          type: 'bar',
          barWidth: 24,
          data: [
            { value: 42, itemStyle: { color: accent + '55', borderRadius: [0, 6, 6, 0] } },
            { value: 60, itemStyle: { color: accent + '88', borderRadius: [0, 6, 6, 0] } },
            { value: 95, itemStyle: { color: accent, borderRadius: [0, 6, 6, 0] } }
          ],
          label: {
            show: true,
            position: 'right',
            formatter: function (p) { return p.value + ' 分'; },
            color: ink,
            fontFamily: fontFamily,
            fontWeight: 700
          }
        }
      ]
    });
    window.addEventListener('resize', function () { trackChart.resize(); });
  }
})();
