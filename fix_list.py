import re
import os

base = r'F:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\src'

files = [
    'components/sage/StrategyPlanningPanel.tsx',
    'components/sage/MarketingPlanPanel.tsx',
    'components/sage/GrowthStrategyPanel.tsx',
    'components/sage/DataAnalysisPanel.tsx',
    'components/sage/BenchmarkPanel.tsx',
    'components/scout/SupplierSearchPanel.tsx',
    'components/scout/IndustryReportPanel.tsx',
    'components/scout/PartnerRecommendationPanel.tsx',
    'components/maker/ContentGenerationPanel.tsx',
    'components/butler/FAQPanel.tsx',
    'components/ChatLayout.tsx',
]

for f in files:
    path = os.path.join(base, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'List' not in content:
        print(f'SKIP (no List): {f}')
        continue
    
    # Pattern for self-closing List: <List dataSource={XXX} renderItem={(item) => (YYY)} />
    pattern = r'<List\s+dataSource=\{(.*?)\}\s+renderItem=\{\((.*?)\)\s*=>\s*\{(.*?)\}\s*\}\s*/>'
    
    def replace_list(match):
        ds = match.group(1).strip()
        param = match.group(2).strip()
        body = match.group(3).strip()
        body = re.sub(r'^return\s*\(\s*', '', body)
        body = re.sub(r'\s*\)\s*;?\s*$', '', body)
        return f'<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{{{ds}.map(({param}) => ({body}))}}</div>'
    
    new_content = re.sub(pattern, replace_list, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'FIXED: {f}')
    else:
        print(f'NO MATCH (try paired): {f}')
        # Try paired pattern: <List ...>...</List>
        paired_pattern = r'<List\s+dataSource=\{(.*?)\}\s+renderItem=\{\((.*?)\)\s*=>\s*\{(.*?)\}\s*\}\s*>(.*?)</List>'
        def replace_paired(match):
            ds = match.group(1).strip()
            param = match.group(2).strip()
            body = match.group(3).strip()
            inner = match.group(4).strip()
            body = re.sub(r'^return\s*\(\s*', '', body)
            body = re.sub(r'\s*\)\s*;?\s*$', '', body)
            return f'<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{{{ds}.map(({param}) => ({body}))}}</div>'
        new_content2 = re.sub(paired_pattern, replace_paired, content, flags=re.DOTALL)
        if new_content2 != content:
            with open(path, 'w', encoding='utf-8') as file:
                file.write(new_content2)
            print(f'FIXED (paired): {f}')
        else:
            print(f'FAILED: {f}')
