process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
    // Sadece yerel ağınıza izin veren CORS ayarları
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // URL'den 'url' parametresini al
    const urlParam = new URL(req.url, `http://${req.headers.host}`).searchParams.get('url');
    
    if (!urlParam) {
        res.writeHead(200);
        res.end('Bayyildiz Yerel Proxy Calisiyor');
        return;
    }

    // İstenilen URL'ye istek at
    https.get(urlParam, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'text/html',
            'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
    }).on('error', (err) => {
        res.writeHead(500);
        res.end('Proxy Hatasi: ' + err.message);
    });
});

const PORT = 3032;
server.listen(PORT, () => {
    console.log(`================================================`);
    console.log(` BAYYILDIZ YEREL SENKRONİZASYON PROXY CALISIYOR`);
    console.log(` Port: ${PORT}`);
    console.log(`================================================`);
    console.log(`Bu pencere açık kaldığı sürece Web'den Senkronize Et butonu çalışacaktır.`);
});
