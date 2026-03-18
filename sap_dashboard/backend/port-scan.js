// Simple port scanner to check SAP B1 server
const net = require('net');

const host = '192.168.0.101';
const ports = [1433, 30015, 30013, 1434, 50000, 8080, 80, 443, 3306, 5432, 8443, 8000];

console.log(`\nScanning ports on ${host}...\n`);

async function checkPort(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);

        socket.on('connect', () => {
            socket.destroy();
            resolve({ port, status: 'OPEN' });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, status: 'CLOSED (timeout)' });
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve({ port, status: `CLOSED (${err.code})` });
        });

        socket.connect(port, host);
    });
}

async function scanAll() {
    const results = await Promise.all(ports.map(checkPort));

    console.log('Port Scan Results:');
    console.log('─'.repeat(40));
    results.forEach(r => {
        const status = r.status === 'OPEN' ? '✓ OPEN' : '✗ ' + r.status;
        console.log(`  Port ${r.port}: ${status}`);
    });

    const openPorts = results.filter(r => r.status === 'OPEN');
    if (openPorts.length === 0) {
        console.log('\n⚠ No database ports are open!');
        console.log('\nThis means:');
        console.log('  1. SQL Server firewall is blocking connections');
        console.log('  2. SQL Server is not configured for TCP/IP');
        console.log('  3. Server admin needs to enable remote access\n');
    }
}

scanAll();

