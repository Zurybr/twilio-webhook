const express = require('express');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Twilio webhook
app.post('/webhook/voice', (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hola! Bienvenido al sistema de llamadas Twilio. Soy Shannon, tu asistente virtual.</Say>
  <Pause length="1"/>
  <Say voice="alice">¿En qué puedo ayudarte hoy?</Say>
  <Record maxLength="30" action="/webhook/recorded" method="POST"/>
</Response>`;
  res.type('text/xml').send(twiml);
});

app.post('/webhook/recorded', (req, res) => {
  console.log('Recording:', req.body);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Gracias por tu mensaje. Te contactaremos pronto.</Say>
</Response>`;
  res.type('text/xml').send(twiml);
});

app.post('/webhook/sms', (req, res) => {
  console.log('SMS received:', req.body);
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Recibido! Shannon te responde: Gracias por tu mensaje.</Message>
</Response>`;
  res.type('text/xml').send(twiml);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'twilio-webhook' }));

app.listen(3000, () => console.log('Twilio app running on 3000'));
