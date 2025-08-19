/**
 * Simple HTTPS Test Server
 * 
 * Basic HTTPS server to test SSL certificates
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0';
const port = 3010;

// Certificate paths
const certificatesDir = './certificates';
const certPath = path.join(certificatesDir, 'cert.pem');
const keyPath = path.join(certificatesDir, 'key.pem');

console.log('Certificate paths:');
console.log('Cert:', certPath, '- exists:', fs.existsSync(certPath));
console.log('Key:', keyPath, '- exists:', fs.existsSync(keyPath));

try {
  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };

  const server = https.createServer(httpsOptions, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>HTTPS Test Server</title></head>
        <body>
          <h1>🔒 HTTPS Working!</h1>
          <p>SSL certificates are working properly.</p>
          <p>URL: ${req.url}</p>
          <p>Method: ${req.method}</p>
          <p>Headers: ${JSON.stringify(req.headers, null, 2)}</p>
        </body>
      </html>
    `);
  });

  server.listen(port, hostname, () => {
    console.log(`🔒 HTTPS server running at https://${hostname}:${port}/`);
    console.log('Test with: curl -k https://localhost:3010/');
  });

  server.on('error', (err) => {
    console.error('HTTPS Server Error:', err);
  });

} catch (error) {
  console.error('Failed to start HTTPS server:', error);
  process.exit(1);
}