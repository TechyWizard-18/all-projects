// SAP Business One Database Connection Test
// This script tests connectivity to the SAP B1 database (read-only)

const sql = require('mssql');

// Connection configuration - Try multiple port options
const serverIP = '192.168.0.101';
const username = 'Manager';
const password = 'Ram@2022';

// Common ports for SAP B1:
// - 1433: SQL Server default
// - 30015: SAP HANA default
// - 30013: SAP HANA system DB
// - 1434: SQL Server Browser

const portsToTry = [1433, 30015, 30013, 1434, 50000];

const getConfig = (port) => ({
    server: serverIP,
    user: username,
    password: password,
    database: 'master',
    port: port,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 10000,
        requestTimeout: 15000
    }
});

async function testConnection() {
    console.log('='.repeat(50));
    console.log('SAP Business One Database Connection Test');
    console.log('='.repeat(50));
    console.log(`\nServer: ${serverIP}`);
    console.log(`User: ${username}`);
    console.log(`Testing ports: ${portsToTry.join(', ')}\n`);

    let connected = false;
    let workingPort = null;
    let pool = null;

    // Try each port
    for (const port of portsToTry) {
        if (connected) break;

        console.log(`Trying port ${port}...`);
        try {
            const config = getConfig(port);
            pool = await sql.connect(config);
            connected = true;
            workingPort = port;
            console.log(`✓ Connected on port ${port}!\n`);
        } catch (err) {
            console.log(`  ✗ Port ${port} failed: ${err.code || err.message.substring(0, 50)}`);
            await sql.close().catch(() => {});
        }
    }

    if (!connected) {
        console.log('\n' + '='.repeat(50));
        console.log('✗ CONNECTION FAILED ON ALL PORTS');
        console.log('='.repeat(50));
        console.log('\nPlease verify:');
        console.log('  1. Server IP address is correct (192.168.0.245)');
        console.log('  2. SQL Server service is running on the server');
        console.log('  3. TCP/IP is enabled in SQL Server Configuration Manager');
        console.log('  4. Windows Firewall allows inbound connections');
        console.log('  5. Your computer can reach the server (try: ping 192.168.0.245)');
        console.log('\nIf using SAP HANA instead of SQL Server:');
        console.log('  - Different driver is needed (@sap/hana-client)');
        process.exit(1);
        return;
    }

    try {
        // List available databases
        console.log('Listing available databases...');
        const dbResult = await pool.request().query(`
            SELECT name 
            FROM sys.databases 
            WHERE database_id > 4
            ORDER BY name
        `);

        console.log('\nAvailable databases:');
        dbResult.recordset.forEach((db, i) => {
            const isSAP = db.name.includes('SBO') || db.name.includes('SAP');
            console.log(`   ${i + 1}. ${db.name} ${isSAP ? '← SAP B1' : ''}`);
        });

        // Find SAP B1 database
        const sapDb = dbResult.recordset.find(db =>
            db.name.includes('SBO') || db.name.toUpperCase().includes('SAP')
        );

        if (sapDb) {
            console.log(`\nConnecting to SAP database: ${sapDb.name}...`);
            await pool.close();

            const sapConfig = { ...getConfig(workingPort), database: sapDb.name };
            pool = await sql.connect(sapConfig);

            // Test read access
            const stats = await pool.request().query(`
                SELECT 
                    (SELECT COUNT(*) FROM OCRD WHERE CardType = 'C') as Customers,
                    (SELECT COUNT(*) FROM OITM) as Items,
                    (SELECT COUNT(*) FROM OINV) as Invoices,
                    (SELECT COUNT(*) FROM ORDR) as Orders
            `);

            console.log('\n' + '='.repeat(50));
            console.log('✓ CONNECTION SUCCESSFUL!');
            console.log('='.repeat(50));
            console.log(`\nDatabase: ${sapDb.name}`);
            console.log(`Port: ${workingPort}`);
            console.log('\nSAP B1 Data Summary:');
            console.log('─'.repeat(30));
            const s = stats.recordset[0];
            console.log(`  Customers: ${s.Customers}`);
            console.log(`  Items: ${s.Items}`);
            console.log(`  Invoices: ${s.Invoices}`);
            console.log(`  Orders: ${s.Orders}`);

            // Save working config
            console.log('\n✓ Ready to build dashboard backend!');
        }

    } catch (err) {
        console.log(`\nError: ${err.message}`);
    } finally {
        await sql.close().catch(() => {});
        process.exit();
    }
}

testConnection();

