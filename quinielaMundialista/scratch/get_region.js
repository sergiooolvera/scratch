const https = require('https');

https.get('https://gyyrcilivzqxzgkcgzfe.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjMxNTgsImV4cCI6MjA5NDQzOTE1OH0.tNGNDVZiJaz9l-B2DPq8RKJEDMIaeFJ15o_U93fsUWs'
  }
}, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
