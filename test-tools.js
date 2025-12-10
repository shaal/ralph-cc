/**
 * Quick test script to verify Glob and Grep implementations
 * Run with: node test-tools.js
 */

const { ToolExecutor } = require('./dist-electron/main/services/tools/ToolExecutor.js');
const path = require('path');

async function testTools() {
  const executor = new ToolExecutor({
    enabled: true,
    allowedPaths: [process.cwd()],
    deniedCommands: [],
  });

  const context = {
    workingDirectory: process.cwd(),
    agentId: 'test-agent',
    projectId: 'test-project',
  };

  console.log('Testing Glob tool...');
  console.log('===================\n');

  // Test 1: Find TypeScript files
  const globResult1 = await executor.execute(
    {
      id: 'glob-1',
      name: 'glob',
      input: { pattern: 'src/**/*.ts' },
    },
    context
  );
  console.log('Pattern: src/**/*.ts');
  console.log('Result (first 10 files):');
  console.log(globResult1.content.split('\n').slice(0, 10).join('\n'));
  console.log('');

  // Test 2: Find markdown files
  const globResult2 = await executor.execute(
    {
      id: 'glob-2',
      name: 'glob',
      input: { pattern: '**/*.md' },
    },
    context
  );
  console.log('Pattern: **/*.md');
  console.log('Result:');
  console.log(globResult2.content);
  console.log('\n');

  console.log('Testing Grep tool...');
  console.log('===================\n');

  // Test 3: Search for "ToolExecutor" in TypeScript files
  const grepResult1 = await executor.execute(
    {
      id: 'grep-1',
      name: 'grep',
      input: {
        pattern: 'class ToolExecutor',
        path: 'src/main/services/tools',
      },
    },
    context
  );
  console.log('Pattern: "class ToolExecutor" in src/main/services/tools');
  console.log('Result:');
  console.log(grepResult1.content);
  console.log('');

  // Test 4: Case-insensitive search
  const grepResult2 = await executor.execute(
    {
      id: 'grep-2',
      name: 'grep',
      input: {
        pattern: 'CONSTELLATION',
        path: 'package.json',
        '-i': true,
      },
    },
    context
  );
  console.log('Pattern: "CONSTELLATION" (case-insensitive) in package.json');
  console.log('Result:');
  console.log(grepResult2.content);
  console.log('\n');

  console.log('All tests completed!');
}

testTools().catch(console.error);
