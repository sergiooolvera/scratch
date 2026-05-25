const https = require('https');

const data = JSON.stringify({
  name: 'Test Bot DMARC Bypass',
  email: 'noreply@quimundial.com',
  'Remitente Real': 'sergio.olver@gmail.com',
  message: 'Prueba final con DMARC bypass y cabecera Referer!',
  _subject: 'Feedback QuiMundial DMARC Test ⚽'
});

const options = {
  hostname: 'formsubmit.co',
  port: 443,
  path: '/ajax/sergio.olver@gmail.com',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Accept': 'application/json',
    'Referer': 'https://quimundial.com'
  }
};

console.log('Enviando solicitud directa a FormSubmit...');
const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
