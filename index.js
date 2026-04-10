const express = require('express');
const app = express();
const { ExpressAdapter } = require('@botpress/webchat');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Data store (simple in-memory)
const calls = [];
const sms = [];

// Web Dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Shannon - Twilio Control</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #fff; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #333; }
    h1 { color: #7c3aed; font-size: 1.8rem; }
    .status { display: flex; align-items: center; gap: 8px; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
    .card { background: #1a1a2e; border-radius: 12px; padding: 20px; border: 1px solid #333; }
    .card h2 { font-size: 1rem; color: #888; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
    .stat { font-size: 2.5rem; font-weight: bold; color: #7c3aed; }
    .stat-label { color: #666; font-size: 0.9rem; margin-top: 5px; }
    .activity { margin-top: 30px; }
    .activity h3 { margin-bottom: 15px; color: #fff; }
    .item { background: #1a1a2e; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #7c3aed; }
    .item-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .item-type { font-weight: bold; color: #7c3aed; }
    .item-time { color: #666; font-size: 0.85rem; }
    .item-body { color: #ccc; font-size: 0.95rem; }
    .btn { background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .btn:hover { background: #6d28d9; }
    .setup { background: #1a1a2e; padding: 20px; border-radius: 12px; margin-top: 30px; }
    .setup h3 { margin-bottom: 15px; }
    .setup pre { background: #0f0f23; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; color: #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 Shannon Control Center</h1>
      <div class="status">
        <div class="status-dot"></div>
        <span>System Online</span>
      </div>
    </header>
    
    <div class="grid">
      <div class="card">
        <h2>Llamadas Totales</h2>
        <div class="stat" id="calls-count">0</div>
        <div class="stat-label">Recibidas</div>
      </div>
      <div class="card">
        <h2>SMS Totales</h2>
        <div class="stat" id="sms-count">0</div>
        <div class="stat-label">Recibidos</div>
      </div>
      <div class="card">
        <h2>Uptime</h2>
        <div class="stat" id="uptime">0%</div>
        <div class="stat-label">Sistema activo</div>
      </div>
    </div>
    
    <div class="activity">
      <h3>📞 Últimas Llamadas</h3>
      <div id="calls-list">
        <div class="item">
          <div class="item-header">
            <span class="item-type">Voice Call</span>
            <span class="item-time">Esperando...</span>
          </div>
          <div class="item-body">Las llamadas aparecerán aquí</div>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">💬 Últimos SMS</h3>
      <div id="sms-list">
        <div class="item">
          <div class="item-header">
            <span class="item-type">SMS</span>
            <span class="item-time">Esperando...</span>
          </div>
          <div class="item-body">Los SMS aparecerán aquí</div>
        </div>
      </div>
    </div>
    
    <div class="setup">
      <h3>⚙️ Webhooks de Twilio</h3>
      <p style="color: #888; margin-bottom: 15px;">Copia estas URLs en tu consola de Twilio:</p>
      <pre>
Voice Webhook:
https://twilio.e6labs.lat/webhook/voice

SMS Webhook:
https://twilio.e6labs.lat/webhook/sms</pre>
      <button class="btn" onclick="testWebhook()">Probar Webhook</button>
    </div>
  </div>
  
  <script>
    let startTime = Date.now();
    function updateStats() {
      fetch('/api/stats').then(r => r.json()).then(data => {
        document.getElementById('calls-count').textContent = data.calls;
        document.getElementById('sms-count').textContent = data.sms;
        const hours = Math.floor((Date.now() - startTime) / 3600000);
        document.getElementById('uptime').textContent = hours + 'h';
      });
    }
    setInterval(updateStats, 5000);
    updateStats();
    
    function testWebhook() {
      fetch('/webhook/sms', { method: 'POST', body: JSON.stringify({ From: '+1234567890', Body: 'Test message' }), headers: {'Content-Type': 'application/json'} })
        .then(() => alert('Webhook test sent!'));
    }
  </script>
</body>
</html>
  `);
});

// API Stats
app.get('/api/stats', (req, res) => {
  res.json({
    calls: calls.length,
    sms: sms.length,
    uptime: process.uptime()
  });
});

// API Calls
app.get('/api/calls', (req, res) => res.json(calls.slice(-20).reverse()));
app.get('/api/sms', (req, res) => res.json(sms.slice(-20).reverse()));

// Twilio Webhooks
app.post('/webhook/voice', (req, res) => {
  calls.push({ ...req.body, time: new Date().toISOString() });
  console.log('Voice call:', req.body);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hola! Soy Shannon. ¿En qué puedo ayudarte?</Say>
  <Pause length="1"/>
  <Say voice="alice">Puedo ayudarte con información, llamadas y más.</Say>
  <Record maxLength="60" action="/webhook/voice/callback" method="POST"/>
</Response>`;
  res.type('text/xml').send(twiml);
});

app.post('/webhook/voice/callback', (req, res) => {
  console.log('Voice recording:', req.body);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Gracias por tu mensaje. Te contactaremos pronto.</Say>
</Response>`;
  res.type('text/xml').send(twiml);
});

app.post('/webhook/sms', (req, res) => {
  sms.push({ ...req.body, time: new Date().toISOString() });
  console.log('SMS received:', req.body);
  const from = req.body.From || 'Unknown';
  const body = req.body.Body || '';
  
  // Simple auto-response
  let response = 'Gracias por tu mensaje. Shannon te responderá pronto.';
  if (body.toLowerCase().includes('hola')) {
    response = '¡Hola! Soy Shannon. ¿En qué puedo ayudarte?';
  } else if (body.toLowerCase().includes('ayuda')) {
    response = 'Puedo ayudarte con información, llamadas y más. ¿Qué necesitas?';
  }
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response}</Message>
</Response>`;
  res.type('text/xml').send(twiml);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Shannon Twilio server running on ${PORT}`));
