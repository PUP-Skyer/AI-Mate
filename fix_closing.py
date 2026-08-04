import os

base = r'F:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\src'

files = [
    'components/sage/StrategyPlanningPanel.tsx',
    'components/sage/MarketingPlanPanel.tsx',
    'components/sage/GrowthStrategyPanel.tsx',
    'components/sage/DataAnalysisPanel.tsx',
    'components/sage/BenchmarkPanel.tsx',
    'components/scout/SupplierSearchPanel.tsx',
    'components/maker/ContentGenerationPanel.tsx',
]

for f in files:
    path = os.path.join(base, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Find lines with "); })}" and add closing </div> after them
    lines = content.split('\n')
    new_lines = []
    fixed = False
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        if '); })}' in line and i + 1 < len(lines):
            # Check if next line already has </div>
            next_line = lines[i + 1]
            if '</div>' not in next_line:
                # Add closing </div> with proper indentation
                # The <div> starts at 12 spaces in all these files
                new_lines.append('            </div>')
                fixed = True
    
    if fixed:
        with open(path, 'w', encoding='utf-8') as file:
            file.write('\n'.join(new_lines))
        print(f'FIXED: {f}')
    else:
        print(f'OK: {f}')
