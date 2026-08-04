# 青宸智汇 一键停止脚本 (Windows)
# 使用方法: 右键 -> 使用 PowerShell 运行

Write-Host "🛑 正在停止所有 青宸智汇 服务..." -ForegroundColor Red

$ports = @(3000, 3001, 3002, 3003, 3004, 4001, 4002, 4003, 8080, 9000)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "  ❌ 已停止 $($proc.ProcessName) (端口 $port)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "✅ 所有服务已停止" -ForegroundColor Green
