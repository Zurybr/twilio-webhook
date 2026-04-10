const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Root
app.get('/', (req, res) => res.json({ 
  service: 'twilio-webhook-shannon',
  version: '1.0.0',
  endpoints: ['/webhook/voice', '/webhook/sms', '/health']
}));

app.post('/webhook/voice', (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hola! Soy Shannon. ¿En qué te ayudo?</Say>
  <Record maxLength="30" />
</Response>`;
  res.type('text/xml').send(twiml);
});

app.post('/webhook/sms', (req, res) => {
  console.log('SMS:', req.body);
  res.type('text/xml').send(`<Response><Message>Hola de Shannon!</Message></Response>`);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'twilio-shannon' }));
app.listen(3000, () => console.log('Twilio app running on 3000'));
