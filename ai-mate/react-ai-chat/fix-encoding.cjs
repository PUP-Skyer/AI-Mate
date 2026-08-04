const fs = require('fs');
const raw = fs.readFileSync('src/components/sage/EntrepreneurshipPlanning.tsx');
let s = raw.toString('utf8');

s = s.replace(/成成/g, '完成');
s = s.replace(/成整/g, '完整');
s = s.replace(/成善/g, '完善');
s = s.replace(/成美/g, '完美');

s = s.replace(/\?\/div>/g, '</div>');
s = s.replace(/\?\/span>/g, '</span>');
s = s.replace(/\?\/Tag>/g, '</Tag>');

s = s.replace(/总进\?\{(p|percent)/g, function(_, m) { return '总进度：{' + m; });
s = s.replace(/快速数据概\?/g, '快速数据概览');
s = s.replace(/选择你的AI工具\?/g, '选择你的AI工具栈');
s = s.replace(/个工\?-/g, '个工具 - ');
s = s.replace(/工作流预\?/g, '工作流预览');
s = s.replace(/轻资产启\?/g, '轻资产启动');
s = s.replace(/产品开\?,/g, '产品开发,');
s = s.replace(/代码开\?,/g, '代码开发,');
s = s.replace(/自动\?,/g, '自动化,');
s = s.replace(/前辈策略\?/g, '前辈策略库');
s = s.replace(/独立开\?,/g, '独立开发,');
s = s.replace(/一人公\?/g, '一人公司');
s = s.replace(/突破50\?/g, '突破50万');
s = s.replace(/多渠道变\?/g, '多渠道变现');
s = s.replace(/品牌合作\?/g, '品牌合作。');
s = s.replace(/收入流\?/g, '收入流。');
s = s.replace(/快速验证\?/g, '快速验证。');
s = s.replace(/国际\?,/g, '国际化,');
s = s.replace(/生态建\?,/g, '生态建设,');
s = s.replace(/创业者生\?/g, '创业者生态');
s = s.replace(/下一代产品和技\?/g, '下一代产品和技术');
s = s.replace(/盈利路\?/g, '盈利路径');
s = s.replace(/快速扩\?/g, '快速扩张');
s = s.replace(/核心功\?/g, '核心功能');
s = s.replace(/企业认\?/g, '企业认定');
s = s.replace(/国际化支\?/g, '国际化支持');
s = s.replace(/建立文\?/g, '建立文化');
s = s.replace(/快速优化产\?/g, '快速优化产品');
s = s.replace(/获取100个注册用\?/g, '获取100个注册用户');
s = s.replace(/日新\?00\+/g, '日新增100+');
s = s.replace(/核心团队3-5\?/g, '核心团队3-5人');
s = s.replace(/海外收入占比20\?/g, '海外收入占比20%');
s = s.replace(/内容创作\?/g, '内容创作者');
s = s.replace(/核心价值主\?/g, '核心价值主张');
s = s.replace(/第一个原\?/g, '第一个原型');
s = s.replace(/深度访\?/g, '深度访谈');
s = s.replace(/内容创作和文案撰\?/g, '内容创作和文案撰写');
s = s.replace(/长文写作和分\?/g, '长文写作和分析');
s = s.replace(/视觉设计和创\?/g, '视觉设计和创意');
s = s.replace(/激活用户\?/g, '激活用户');
s = s.replace(/相关状\?\s*const/g, '相关状态\n  const');

s = s.replace(/'初创\?'/g, "'初创期'");
s = s.replace(/'成长\?'/g, "'成长期'");
s = s.replace(/'成熟\?'/g, "'成熟期'");

s = s.replace(/500\?/g, '500万');
s = s.replace(/'1000\?'/g, "'1000万+'");
s = s.replace(/'50-100\?\s/g, "'50-100万 ");
s = s.replace(/'200-500\?\s/g, "'200-500万 ");

fs.writeFileSync('src/components/sage/EntrepreneurshipPlanning.tsx', s, 'utf8');
console.log('Done fixing EntrepreneurshipPlanning.tsx');
