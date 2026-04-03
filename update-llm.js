const fs = require('fs');
const path = require('path');

const fileStrategies = {
  'content-generator.ts': 'content',
  'content-sources.ts': 'content',
  'learner-profile-service.ts': 'reasoning',
  'knowledge-graph.ts': 'reasoning',
  'personalized-refresher.ts': 'reasoning',
  'adaptive-chat.ts': 'reasoning',
  'routers.ts': 'reasoning'
};

const serverDir = path.join(__dirname, 'server');

for (const [filename, strategy] of Object.entries(fileStrategies)) {
  const filepath = path.join(serverDir, filename);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');

  if (filename !== 'routers.ts') {
    content = content.replace(/import { invokeLLM } from "\.\/_core\/llm";/g, 'import { orchestrateLLM } from "./ai-orchestrator";');
  } else {
    // In routers.ts, we already added `orchestrateLLM`, so we safely remove the invokeLLM import if it's there
    content = content.replace(/import { invokeLLM } from "\.\/_core\/llm";\n/g, '');
  }

  content = content.replace(/invokeLLM\(/g, `orchestrateLLM("${strategy}", `);
  
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Updated ${filename}`);
}
