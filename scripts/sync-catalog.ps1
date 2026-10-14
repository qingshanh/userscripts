param(
  [string]$RepoOwner = "qingshanh",
  [string]$RepoName = "userscripts"
)

$baseDir = "D:\Lance\hh\code\油猴"
$distDir = Join-Path $baseDir "dist"
$repoUrl = "https://github.com/$RepoOwner/$RepoName"
$rawBaseUrl = "https://raw.githubusercontent.com/$RepoOwner/$RepoName/main/dist"
$ghProxyBaseUrl = "https://ghproxy.net/https://raw.githubusercontent.com/$RepoOwner/$RepoName/main/dist"

if (-not (Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

$scriptFiles = Get-ChildItem -Path $baseDir -Recurse -Filter "*.user.js" | Where-Object {
  $_.FullName -notmatch "\\dist\\" -and
  $_.FullName -notmatch "\\node_modules\\" -and
  $_.FullName -notmatch "\\\.git\\" -and
  $_.FullName -notmatch "\\\.agents\\"
}

Write-Output "Found $($scriptFiles.Count) userscripts in workspace."

$scriptInfos = @()

foreach ($file in $scriptFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $filename = $file.Name
  $relDir = $file.Directory.Name

  if ($content -match "(?s)// ==UserScript==\r?\n(.*?)\r?\n// ==/UserScript==") {
    $metaBlock = $matches[1]

    # 解析字段
    $name = if ($metaBlock -match "@name\s+(.+)") { $matches[1].Trim() } else { $filename }
    $version = if ($metaBlock -match "@version\s+(.+)") { $matches[1].Trim() } else { "1.0.0" }
    $desc = if ($metaBlock -match "@description\s+(.+)") { $matches[1].Trim() } else { "暂无描述" }
    $author = if ($metaBlock -match "@author\s+(.+)") { $matches[1].Trim() } else { "Lance" }

    $targetUpdateUrl = "$rawBaseUrl/$filename"
    $targetDownloadUrl = "$rawBaseUrl/$filename"
    $targetHomepageUrl = $repoUrl
    $targetSupportUrl = "$repoUrl/issues"
    $targetNamespace = $repoUrl

    # 规范化元数据中的真实 GitHub 链接 (避免双重 //)
    $lines = $metaBlock -split "\r?\n"
    $newLines = @()
    $hasNamespace = $false
    $hasHomepage = $false
    $hasSupport = $false
    $hasUpdate = $false
    $hasDownload = $false

    foreach ($line in $lines) {
      if ($line -match "@namespace") {
        $newLines += "// @namespace    $targetNamespace"
        $hasNamespace = $true
      } elseif ($line -match "@homepageURL") {
        $newLines += "// @homepageURL  $targetHomepageUrl"
        $hasHomepage = $true
      } elseif ($line -match "@supportURL") {
        $newLines += "// @supportURL   $targetSupportUrl"
        $hasSupport = $true
      } elseif ($line -match "@updateURL") {
        $newLines += "// @updateURL    $targetUpdateUrl"
        $hasUpdate = $true
      } elseif ($line -match "@downloadURL") {
        $newLines += "// @downloadURL  $targetDownloadUrl"
        $hasDownload = $true
      } else {
        $newLines += $line
      }
    }

    if (-not $hasNamespace) { $newLines += "// @namespace    $targetNamespace" }
    if (-not $hasHomepage)  { $newLines += "// @homepageURL  $targetHomepageUrl" }
    if (-not $hasSupport)   { $newLines += "// @supportURL   $targetSupportUrl" }
    if (-not $hasUpdate)    { $newLines += "// @updateURL    $targetUpdateUrl" }
    if (-not $hasDownload)  { $newLines += "// @downloadURL  $targetDownloadUrl" }

    $newMetaBlock = $newLines -join "`n"

    # 写回源文件
    $newContent = $content -replace "(?s)// ==UserScript==\r?\n.*?\r?\n// ==/UserScript==", "// ==UserScript==`n$newMetaBlock`n// ==/UserScript=="
    [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)

    # 同步复制到 dist/ 目录
    $distFilePath = Join-Path $distDir $filename
    [System.IO.File]::WriteAllText($distFilePath, $newContent, [System.Text.Encoding]::UTF8)

    $scriptInfos += [PSCustomObject]@{
      Name = $name
      Version = $version
      Description = $desc
      Author = $author
      Filename = $filename
      RelDir = $relDir
      RawUrl = $targetDownloadUrl
      ProxyUrl = "$ghProxyBaseUrl/$filename"
    }

    Write-Output "Synced $filename (v$version) -> dist/$filename"
  }
}

# 生成根目录 README.md
$readmeLines = @(
  "# 油猴脚本合集 (Tampermonkey Scripts)",
  "",
  "本仓库专门维护个人原创开发的高质量浏览器用户脚本（支持 Tampermonkey / ScriptCat / Violentmonkey / 手机端浏览器）。",
  "",
  "所有脚本均经过真实环境严格测试，采用独立 Shadow DOM 样式隔离、全端触控与手势适配、以及无外部 CDN 依赖的轻量设计。",
  "",
  "---",
  "",
  "## 📋 脚本清单与安装直链",
  "",
  "点击下表中的 **「🚀 立即安装」**，浏览器油猴扩展将自动弹出脚本安装界面；若国内网络访问 GitHub 较慢，可点击 **「⚡ 加速安装」**。",
  "",
  "| 序号 | 脚本名称 | 功能简介 | 最新版本 | 油猴直链安装 | 国内加速安装 | 源码工程 |",
  "| :---: | :--- | :--- | :---: | :---: | :---: | :---: |"
)

$index = 1
foreach ($info in $scriptInfos) {
  $readmeLines += "| $index | **$($info.Name)** | $($info.Description) | $([char]96)v$($info.Version)$([char]96) | [🚀 立即安装]($($info.RawUrl)) | [⚡ 加速安装]($($info.ProxyUrl)) | [查看源码]($($info.RelDir)/) |"
  $index++
}

$readmeLines += @(
  "",
  "---",
  "",
  "## 📱 手机端浏览器使用指引",
  "",
  "- **Android (Via 浏览器 / X 浏览器)**：",
  "  - 打开浏览器「设置」->「脚本」->「新建脚本」；",
  "  - 复制对应脚本的「国内加速安装」或「立即安装」直链直接导入，或在浏览器中直接打开该链接自动触发安装。",
  "- **Android (Kiwi / Firefox 移动版)**：",
  "  - 安装 Tampermonkey 扩展插件后，直接在浏览器中点击上表中的安装链接即可。",
  "- **iOS (Safari)**：",
  "  - App Store 安装 **Userscripts** 或 **Stay** 扩展，点击安装直链导入使用。",
  "",
  "---",
  "",
  "## 🛠️ 项目工程规范",
  "",
  "- \`dist/\`：已发布、可供一键安装的最新纯净脚本（包含真实的 GitHub Raw 更新与下载地址）。",
  "- \`[脚本名]/\`：独立开发工程目录，包含源码、\`test-page.html\` 本地测试沙箱与独立说明。",
  "- \`scripts/sync-catalog.ps1\`：一键元数据链接校验、分发文件打包与总目录 README 刷新脚本。",
  "",
  "---",
  "",
  "## 📄 开源许可",
  "",
  "[MIT License](LICENSE)"
)

$rootReadmePath = Join-Path $baseDir "README.md"
[System.IO.File]::WriteAllLines($rootReadmePath, $readmeLines, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated root README.md with $($scriptInfos.Count) scripts."