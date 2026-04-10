const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Your real phone number - Zury will receive calls/SMS
const ZURY_PHONE = '+525588974435';

// Data file for persistence
const DATA_FILE = '/tmp/twilio-data.json';

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return { calls: [], sms: [] };
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}

// Web Dashboard
app.get('/', (req, res) => {
  const data = loadData();
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
    .setup { background: #1a1a2e; padding: 20px; border-radius: 12px; margin-top: 30px; }
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
        <div class="stat" id="calls-count">${data.calls.length}</div>
        <div class="stat-label">Recibidas</div>
      </div>
      <div class="card">
        <h2>SMS Totales</h2>
        <div class="stat" id="sms-count">${data.sms.length}</div>
        <div class="stat-label">Recibidos</div>
      </div>
      <div class="card">
        <h2>Uptime</h2>
        <div class="stat" id="uptime">0h</div>
        <div class="stat-label">Sistema activo</div>
      </div>
    </div>
    
    <div class="activity">
      <h3>📞 Últimas Llamadas</h3>
      <div id="calls-list">
        ${data.calls.length > 0 ? data.calls.slice(-5).reverse().map(c => `
          <div class="item">
            <div class="item-header">
              <span class="item-type">Voice Call</span>
              <span class="item-time">${new Date(c.time).toLocaleString()}</span>
            </div>
            <div class="item-body">From: ${c.From || 'Unknown'}</div>
          </div>
        `).join('') : '<div class="item"><div class="item-body">Esperando llamadas...</div></div>'}
      </div>
      
      <h3 style="margin-top: 30px;">💬 Últimos SMS</h3>
      <div id="sms-list">
        ${data.sms.length > 0 ? data.sms.slice(-5).reverse().map(s => `
          <div class="item">
            <div class="item-header">
              <span class="item-type">SMS</span>
              <span class="item-time">${new Date(s.time).toLocaleString()}</span>
            </div>
            <div class="item-body"><strong>De:</strong> ${s.From || 'Unknown'}<br><strong>Mensaje:</strong> ${s.Body || ''}</div>
          </div>
        `).join('') : '<div class="item"><div class="item-body">Esperando SMS...</div></div>'}
      </div>
    </div>
    
    <div class="setup">
      <h3>⚙️ Configuración</h3>
      <pre>
📱 Tu número: ${ZURY_PHONE

}
🌐 Webhooks configurados:
Voice: https://twilio.e6labs.lat/webhook/voice
SMS:   https://twilio.e6labs.lat/webhook/sms
      </pre>
    </div>
  </div>
</body>
</html>
  `);
});

// API Stats
app.get('/api/stats', (req, res) => {
  const data = loadData();
  res.json({
    calls: data.calls.length,
    sms: data.sms.length,
    uptime: process.uptime()
  });
});

// API Calls
app.get('/api/calls', (req, res) => {
  const data = loadData();
  res.json(data.calls.slice(-20).reverse());
});

app.get('/api/sms', (req, res) => {
  const data = loadData();
  res.json(data.sms.slice(-20).reverse());
});

// Twilio Voice Webhook - FORWARD CALL TO ZURY
app.post('/webhook/voice', (req, res) => {
  const data = loadData();
  data.calls.push({ ...req.body, time: new Date().toISOString() });
  saveData(data);
  
  console.log('Voice call received:', req.body);
  
  // Forward the call to Zury's real phone
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Tienes una llamada entrante. Redirigiendo...</Say>
  <Dial callerId="${ZURY_PHONE}" record="record-from-ringing">
    <Number>${ZURY_PHONE}</Number>
  </Dial>
</Response>`;
  
  res.type('text/xml').send(twiml);
});

// Twilio SMS Webhook - FORWARD SMS TO ZURY  
app.post('/webhook/sms', (req, res) => {
  const data = loadData();
  data.sms.push({ ...req.body, time: new Date().toISOString() });
  saveData(data);
  
  const from = req.body.From || 'Unknown';
  const body = req.body.Body || '';
  
  console.log('SMS received from', from, ':', body);
  
  // Respond that message was forwarded
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Recibido. Tu mensaje fue enviado a ${ZURY_PHONE}. Te contactaremos pronto.</Message>
</Response>`;
  
  res.type('text/xml').send(twiml);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Shannon Twilio server running on ${PORT} - Forwarding to ${ZURY_PHONE}`));
