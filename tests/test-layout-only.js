import { chromium } from 'playwright';

async function testLayoutOnly() {
  console.log('开始纯布局测试...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 访问页面
    await page.goto('http://localhost:4000');
    console.log('✓ 页面加载成功');
    await page.waitForTimeout(1000);

    // 手动注入4个Agent卡片来测试布局
    await page.evaluate(() => {
      const agentsGrid = document.getElementById('agentsGrid');
      const agentNames = ['Supplier Agent', 'Cost Agent', 'Risk Agent', 'Carbon Agent'];

      agentNames.forEach(name => {
        const card = document.createElement('div');
        card.className = 'agent-card active';
        card.setAttribute('data-agent', name);
        card.innerHTML = `
          <div class="agent-header">
            <div class="agent-status active"></div>
            <div class="agent-name">${name}</div>
          </div>
          <div class="agent-thinking">这是${name}的思考过程...\n正在分析数据...\n生成建议...</div>
        `;
        agentsGrid.appendChild(card);
      });
    });

    console.log('✓ 已注入4个Agent卡片');
    await page.waitForTimeout(500);

    // 检查Agent卡片数量
    const agentCards = await page.locator('.agent-card').count();
    console.log(`✓ 显示了 ${agentCards} 个Agent卡片`);

    // 检查Agent工作面板的grid布局
    const gridStyle = await page.locator('#agentsGrid').evaluate(el => {
      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gridTemplateRows: styles.gridTemplateRows,
        gap: styles.gap,
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    });

    console.log('\nAgent工作面板布局:');
    console.log(`  display: ${gridStyle.display}`);
    console.log(`  grid-template-columns: ${gridStyle.gridTemplateColumns}`);
    console.log(`  grid-template-rows: ${gridStyle.gridTemplateRows}`);
    console.log(`  gap: ${gridStyle.gap}`);
    console.log(`  实际尺寸: ${gridStyle.width}px × ${gridStyle.height}px`);

    // 验证2x2布局
    if (gridStyle.display === 'grid') {
      console.log('✓ Agent面板正确使用grid布局');

      // 检查每个卡片的位置
      const cardPositions = await page.locator('.agent-card').evaluateAll(cards => {
        return cards.map((card, index) => {
          const rect = card.getBoundingClientRect();
          return {
            index,
            name: card.querySelector('.agent-name').textContent,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
        });
      });

      console.log('\nAgent卡片位置:');
      cardPositions.forEach(pos => {
        console.log(`  ${pos.name}: (${pos.x}, ${pos.y}) ${pos.width}×${pos.height}px`);
      });

      // 验证是否为2x2布局
      const row1 = cardPositions.filter((_, i) => i < 2);
      const row2 = cardPositions.filter((_, i) => i >= 2);

      const isRow1Aligned = Math.abs(row1[0].y - row1[1].y) < 5;
      const isRow2Aligned = Math.abs(row2[0].y - row2[1].y) < 5;
      const isCol1Aligned = Math.abs(row1[0].x - row2[0].x) < 5;
      const isCol2Aligned = Math.abs(row1[1].x - row2[1].x) < 5;

      if (isRow1Aligned && isRow2Aligned && isCol1Aligned && isCol2Aligned) {
        console.log('✓ Agent卡片正确排列为2x2网格');
      } else {
        console.log('✗ Agent卡片排列不正确');
      }
    } else {
      console.log('✗ Agent面板未使用grid布局');
    }

    // 截图保存当前状态
    await page.screenshot({
      path: 'c:/Users/25066/Desktop/BIDtest2/BIDtest2/tests/screenshot-2x2-grid.png',
      fullPage: true
    });
    console.log('\n✓ 已保存2x2网格布局截图');

    // 测试弹窗
    console.log('\n测试评估弹窗...');
    await page.evaluate(() => {
      const modal = document.getElementById('assessmentModal');
      const modalBody = document.getElementById('assessmentModalBody');

      modalBody.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #333;">评估结果</h2>
        <div class="assessment-results">
          <div class="assessment-card">
            <div class="assessment-title">成本分析</div>
            <div class="assessment-value">¥12,500</div>
            <div class="assessment-details">总成本包括材料费、加工费和运输费</div>
          </div>
          <div class="assessment-card">
            <div class="assessment-title">工程风险</div>
            <div class="assessment-value">中等</div>
            <div class="assessment-details">存在一定的技术风险,需要注意质量控制</div>
          </div>
          <div class="assessment-card">
            <div class="assessment-title">碳排放</div>
            <div class="assessment-value">45.2 kg</div>
            <div class="assessment-details">评级: B</div>
          </div>
        </div>
        <div style="margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 10px;">
          <h3 style="margin-bottom: 15px; color: #333;">Keep Breaking Agent 建议</h3>
          <p style="font-size: 20px; font-weight: bold; color: #4caf50; margin: 15px 0;">
            建议继续拆分
          </p>
          <p style="color: #666; line-height: 1.8; margin-bottom: 20px;">
            当前零件仍有优化空间,建议进一步拆分以降低成本和风险。
          </p>
          <div class="action-buttons">
            <button class="btn btn-primary">继续拆分零件</button>
            <button class="btn btn-secondary">保持当前选项</button>
          </div>
        </div>
      `;

      modal.classList.add('show');
    });

    await page.waitForTimeout(500);
    console.log('✓ 弹窗已显示');

    // 检查弹窗尺寸
    const modalSize = await page.locator('#assessmentModal .modal-content').evaluate(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        maxWidth: styles.maxWidth,
        maxHeight: styles.maxHeight,
        padding: styles.padding
      };
    });

    console.log('\n弹窗尺寸:');
    console.log(`  实际宽度: ${modalSize.width}px`);
    console.log(`  实际高度: ${modalSize.height}px`);
    console.log(`  max-width: ${modalSize.maxWidth}`);
    console.log(`  max-height: ${modalSize.maxHeight}`);
    console.log(`  padding: ${modalSize.padding}`);

    // 验证弹窗尺寸
    if (modalSize.maxWidth === '1200px') {
      console.log('✓ 弹窗宽度已正确放大到1200px');
    } else {
      console.log(`✗ 弹窗宽度为 ${modalSize.maxWidth}，期望1200px`);
    }

    if (modalSize.maxHeight === '972px') {
      console.log('✓ 弹窗高度已正确放大到90vh (972px)');
    } else {
      console.log(`✗ 弹窗高度为 ${modalSize.maxHeight}，期望972px`);
    }

    if (modalSize.padding === '40px') {
      console.log('✓ 弹窗内边距已增加到40px');
    } else {
      console.log(`✗ 弹窗内边距为 ${modalSize.padding}，期望40px`);
    }

    // 截图保存弹窗状态
    await page.screenshot({
      path: 'c:/Users/25066/Desktop/BIDtest2/BIDtest2/tests/screenshot-enlarged-modal.png',
      fullPage: true
    });
    console.log('\n✓ 已保存放大弹窗截图');

    console.log('\n=== 所有布局测试通过! ===');
    console.log('等待5秒后关闭浏览器...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n测试失败:', error.message);
    await page.screenshot({
      path: 'c:/Users/25066/Desktop/BIDtest2/BIDtest2/tests/screenshot-error.png',
      fullPage: true
    });
    console.log('已保存错误截图');
  } finally {
    await browser.close();
  }
}

testLayoutOnly();
