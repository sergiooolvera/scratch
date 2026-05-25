const https = require('https');

const data = JSON.stringify({
  name: 'Prueba Local Directa',
  email: 'sergio.olver@gmail.com',
  message: 'Esta es una prueba de envío directo desde tu computadora a FormSubmit para activar el correo!',
  _subject: 'Activar Sugerencias QuiMundial ⚽'
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
