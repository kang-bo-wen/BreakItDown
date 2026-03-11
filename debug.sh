#!/bin/bash

# Playwright MCP 调试快速启动脚本

echo "🎭 Playwright MCP 调试工具"
echo "=========================="
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 显示菜单
echo "请选择调试模式："
echo ""
echo "1. UI 模式 - 可视化测试界面（推荐）"
echo "2. 调试模式 - 使用调试配置运行测试"
echo "3. 交互式调试 - 浏览器保持打开 5 分钟"
echo "4. 代码生成器 - 录制操作生成测试代码"
echo "5. 查看测试报告"
echo "6. 安装 Playwright 浏览器"
echo "7. 运行特定测试文件"
echo "0. 退出"
echo ""

read -p "请输入选项 (0-7): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动 Playwright UI 模式..."
        npx playwright test --ui --config=playwright-debug.config.ts
        ;;
    2)
        echo ""
        echo "🐛 使用调试配置运行测试..."
        npx playwright test tests/mcp-debug.spec.ts --config=playwright-debug.config.ts --grep="完整流程"
        ;;
    3)
        echo ""
        echo "🎮 启动交互式调试..."
        echo "浏览器将保持打开 5 分钟，你可以手动操作"
        npx playwright test tests/mcp-debug.spec.ts --config=playwright-debug.config.ts --grep="交互式"
        ;;
    4)
        echo ""
        echo "📹 启动代码生成器..."
        echo "操作浏览器，Playwright 会自动生成测试代码"
        npx playwright codegen http://localhost:3000
        ;;
    5)
        echo ""
        echo "📊 打开测试报告..."
        npx playwright show-report
        ;;
    6)
        echo ""
        echo "📦 安装 Playwright 浏览器..."
        npx playwright install
        ;;
    7)
        echo ""
        echo "可用的测试文件："
        ls -1 tests/*.spec.ts | nl
        echo ""
        read -p "请输入测试文件名（例如：manual-tree-popup.spec.ts）: " testfile
        if [ -f "tests/$testfile" ]; then
            echo ""
            echo "🧪 运行测试: $testfile"
            npx playwright test "tests/$testfile" --config=playwright-debug.config.ts
        else
            echo "❌ 文件不存在: tests/$testfile"
        fi
        ;;
    0)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "✅ 完成！"
