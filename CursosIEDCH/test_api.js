const fetch = require('node-fetch');

async function testApi() {
    try {
        const res = await fetch('http://localhost:3000/api/approve-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pagoId: 'test-id',
                userId: 'test-user',
                cursoId: 'test-curso',
                userEmail: 'test@test.com',
                userName: 'Test',
                cursoTitulo: 'Test Curso',
                accion: 'aprobar'
            })
        });
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("BODY START ===\n", text.substring(0, 500), "\n=== BODY END");
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
}

testApi();
