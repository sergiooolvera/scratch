const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\Propuesta 1.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(function (error) {
    console.error(error);
});
