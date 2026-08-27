const { exec } = require('child_process');
const http = require('http');

http.get('http://localhost:8081/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const targets = JSON.parse(data);
      const target = targets.reverse().find(t => t.devtoolsFrontendUrl);
      if (target) {
        const url = `http://localhost:8081${target.devtoolsFrontendUrl}`;
        console.log('✅ Opening Hermes DevTools for', target.title || target.deviceName);
        console.log('🔗 URL:', url);
        exec(`xdg-open "${url}"`);
      } else {
        console.log('⚠️ No active Hermes target found. Please open the SeniorShield app on your phone.');
      }
    } catch (e) {
      console.error('❌ Failed to parse debugger targets:', e);
    }
  });
}).on('error', (err) => {
  console.error('❌ Metro server not reachable on port 8081:', err.message);
});
