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
    'components/maker/ContentGenerationPanel.tsx',
]

for f in files:
    path = os.path.join(base, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    original = content
    
    # Fix 1: style={ display: -> style={{ display:
    content = content.replace('style={ display: "flex", flexDirection: "column", gap: 12 }>', 
                              'style={{ display: "flex", flexDirection: "column", gap: 12 }}>')
    
    # Fix 2: map((...) => (const -> map((...) => { const
    content = re.sub(r'map\(\((.*?)\)\s*=>\s*\(const', r'map(\(\1\) => { const', content)
    
    # Fix 3: style={{ fontSize: 12))}</div> -> style={{ fontSize: 12 }} />
    content = content.replace('style={{ fontSize: 12))}</div>', 'style={{ fontSize: 12 }} />')
    
    # Fix 4: style={{ fontSize: 14))}</div> -> style={{ fontSize: 14 }} />
    content = content.replace('style={{ fontSize: 14))}</div>', 'style={{ fontSize: 14 }} />')
    
    # Fix 5: </Card>))}</div> -> </Card>)}</div>
    content = content.replace('</Card>))}</div>', '</Card>)}</div>')
    
    # Fix 6: Fix endings - }} /> or ))} /> patterns at the end of the map
    # Replace "; ))} />" or "; }} />" with "; })}" and add </div>
    content = re.sub(r';\s*\)\)\}\s*/>', '; })}', content)
    content = re.sub(r';\s*\}\}\s*/>', '; })}', content)
    
    # Fix 7: "\n            />\n" -> "\n            </div>\n" (for 12-space indented div)
    content = content.replace('\n            />\n', '\n            </div>\n')
    content = content.replace('\n          />\n', '\n          </div>\n')
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f'FIXED: {f}')
    else:
        print(f'NO CHANGE: {f}')
