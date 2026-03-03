import express from 'express';
import { WebSocketServer } from 'ws';
import { WorkflowService } from './services/workflow-service.js';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const START_PORT = 4000;
const MAX_PORT = 4010; // 最多尝试到 4010

// 检测端口是否可用
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// 查找可用端口
async function findAvailablePort(startPort) {
  for (let port = startPort; port <= MAX_PORT; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`端口 ${port} 已被占用，尝试下一个...`);
  }
  throw new Error(`无法找到可用端口 (${startPort}-${MAX_PORT})`);
}

// 启动服务器
async function startServer() {
  const PORT = await findAvailablePort(START_PORT);

  // 静态文件服务
  app.use(express.static(path.join(__dirname, '../public')));

  // API 端点：返回当前端口
  app.get('/api/port', (_req, res) => {
    res.json({ port: PORT });
  });

  const server = app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });

  // WebSocket服务器
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('客户端已连接');

    const workflow = new WorkflowService();

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleClientMessage(ws, workflow, data);
      } catch (error) {
        console.error('处理消息错误:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('客户端已断开');
    });
  });
}

startServer().catch(console.error);

async function handleClientMessage(ws, workflow, data) {
  const onThinking = (thinkingData) => {
    ws.send(JSON.stringify({
      type: 'thinking',
      agent: thinkingData.agent,
      content: thinkingData.content
    }));
  };

  switch (data.type) {
    case 'start_breakdown':
      const parts = await workflow.startProductBreakdown(data.productName, onThinking);
      ws.send(JSON.stringify({
        type: 'parts_breakdown',
        parts: parts
      }));
      break;

    case 'find_suppliers':
      const part = findPartById(workflow.getPartsTree(), data.partId);
      if (part) {
        const suppliers = await workflow.findSuppliersForPart(part, onThinking);
        ws.send(JSON.stringify({
          type: 'suppliers_found',
          suppliers: suppliers
        }));
      }
      break;

    case 'start_customization':
      const customPart = findPartById(workflow.getPartsTree(), data.partId);
      if (customPart) {
        const questions = await workflow.startCustomization(customPart, onThinking);
        ws.send(JSON.stringify({
          type: 'customization_questions',
          questions: questions
        }));
      }
      break;

    case 'generate_processes':
      const processPart = findPartById(workflow.getPartsTree(), data.partId);
      if (processPart) {
        const processes = await workflow.generateProcesses(
          processPart,
          data.customizedParams,
          onThinking
        );
        ws.send(JSON.stringify({
          type: 'processes_generated',
          processes: processes
        }));
      }
      break;

    case 'enter_state_a':
      const statePart = findPartById(workflow.getPartsTree(), data.partId);
      if (statePart) {
        const results = await workflow.enterStateA(
          statePart,
          data.option,
          data.optionType,
          onThinking
        );
        ws.send(JSON.stringify({
          type: 'assessment_complete',
          results: results
        }));
      }
      break;

    case 'breakdown_part':
      const breakPart = findPartById(workflow.getPartsTree(), data.partId);
      if (breakPart) {
        const subParts = await workflow.breakdownPart(breakPart, onThinking);
        ws.send(JSON.stringify({
          type: 'parts_breakdown',
          parts: workflow.getPartsTree()
        }));
      }
      break;

    default:
      console.log('未知消息类型:', data.type);
  }
}

function findPartById(parts, partId) {
  for (const part of parts) {
    if (part.id === partId) {
      return part;
    }
    if (part.children && part.children.length > 0) {
      const found = findPartById(part.children, partId);
      if (found) return found;
    }
  }
  return null;
}