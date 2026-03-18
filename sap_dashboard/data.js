// ===== SAP Business One Dashboard - Simulated Data =====
// In production, this data would come from SAP B1 database via SQL queries

/*
===========================================
SAP B1 SQL QUERIES REFERENCE
===========================================

These are the SQL queries that would be used to fetch data from SAP Business One HANA database.
You can modify these queries based on your specific SAP B1 configuration.

-- 1. Total Revenue (Current Period)
SELECT SUM(T0."DocTotal") AS "TotalRevenue"
FROM OINV T0
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N';

-- 2. Total Orders Count
SELECT COUNT(T0."DocEntry") AS "TotalOrders"
FROM ORDR T0
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N';

-- 3. New Customers (Current Period)
SELECT COUNT(T0."CardCode") AS "NewCustomers"
FROM OCRD T0
WHERE T0."CreateDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CardType" = 'C';

-- 4. Gross Profit
SELECT SUM(T0."GrosProfit") AS "GrossProfit"
FROM OINV T0
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N';

-- 5. Inventory Value
SELECT SUM(T0."OnHand" * T0."AvgPrice") AS "InventoryValue"
FROM OITW T0
INNER JOIN OITM T1 ON T0."ItemCode" = T1."ItemCode"
WHERE T1."InvntItem" = 'Y';

-- 6. Pending Orders
SELECT COUNT(T0."DocEntry") AS "PendingOrders"
FROM ORDR T0
WHERE T0."DocStatus" = 'O'
AND T0."CANCELED" = 'N';

-- 7. Recent Orders
SELECT TOP 10
    T0."DocNum" AS "OrderNum",
    T1."CardName" AS "Customer",
    T0."DocDate" AS "Date",
    T0."DocTotal" AS "Amount",
    CASE
        WHEN T0."DocStatus" = 'O' THEN 'Pending'
        WHEN T0."DocStatus" = 'C' THEN 'Completed'
    END AS "Status"
FROM ORDR T0
INNER JOIN OCRD T1 ON T0."CardCode" = T1."CardCode"
WHERE T0."CANCELED" = 'N'
ORDER BY T0."DocDate" DESC;

-- 8. Low Stock Items
SELECT
    T0."ItemCode",
    T0."ItemName" AS "Description",
    T0."OnHand" AS "InStock",
    T0."MinLevel" AS "ReorderLevel"
FROM OITM T0
WHERE T0."OnHand" <= T0."MinLevel"
AND T0."InvntItem" = 'Y'
ORDER BY T0."OnHand" ASC;

-- 9. Sales by Category
SELECT
    T1."ItmsGrpNam" AS "Category",
    SUM(T0."LineTotal") AS "Sales"
FROM INV1 T0
INNER JOIN OITM T2 ON T0."ItemCode" = T2."ItemCode"
INNER JOIN OITB T1 ON T2."ItmsGrpCod" = T1."ItmsGrpCod"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
GROUP BY T1."ItmsGrpNam"
ORDER BY SUM(T0."LineTotal") DESC;

-- 10. Top Selling Products
SELECT TOP 10
    T1."ItemCode",
    T1."ItemName",
    SUM(T0."Quantity") AS "UnitsSold",
    SUM(T0."LineTotal") AS "Revenue"
FROM INV1 T0
INNER JOIN OITM T1 ON T0."ItemCode" = T1."ItemCode"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
GROUP BY T1."ItemCode", T1."ItemName"
ORDER BY SUM(T0."Quantity") DESC;

-- 11. Sales by Region
SELECT
    T1."State" AS "Region",
    SUM(T0."DocTotal") AS "Sales"
FROM OINV T0
INNER JOIN OCRD T1 ON T0."CardCode" = T1."CardCode"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N'
GROUP BY T1."State"
ORDER BY SUM(T0."DocTotal") DESC;

-- 12. Sales Rep Performance
SELECT
    T1."SlpName" AS "SalesRep",
    SUM(T0."DocTotal") AS "Sales",
    COUNT(T0."DocEntry") AS "OrderCount"
FROM OINV T0
INNER JOIN OSLP T1 ON T0."SlpCode" = T1."SlpCode"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N'
GROUP BY T1."SlpName"
ORDER BY SUM(T0."DocTotal") DESC;

-- 13. Accounts Receivable Aging
SELECT
    CASE
        WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) <= 0 THEN 'Current'
        WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE '90+ Days'
    END AS "AgingPeriod",
    SUM(T0."DocTotal" - T0."PaidToDate") AS "Amount"
FROM OINV T0
WHERE T0."DocStatus" = 'O'
AND T0."CANCELED" = 'N'
GROUP BY CASE
    WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) <= 0 THEN 'Current'
    WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) BETWEEN 1 AND 30 THEN '1-30 Days'
    WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) BETWEEN 31 AND 60 THEN '31-60 Days'
    WHEN DATEDIFF(DAY, T0."DocDueDate", CURRENT_DATE) BETWEEN 61 AND 90 THEN '61-90 Days'
    ELSE '90+ Days'
END;

-- 14. Monthly Revenue Trend
SELECT
    YEAR(T0."DocDate") AS "Year",
    MONTH(T0."DocDate") AS "Month",
    SUM(T0."DocTotal") AS "Revenue"
FROM OINV T0
WHERE T0."DocDate" >= ADD_MONTHS(CURRENT_DATE, -12)
AND T0."CANCELED" = 'N'
GROUP BY YEAR(T0."DocDate"), MONTH(T0."DocDate")
ORDER BY YEAR(T0."DocDate"), MONTH(T0."DocDate");

-- 15. Top Vendors by Spend
SELECT TOP 10
    T1."CardName" AS "Vendor",
    SUM(T0."DocTotal") AS "TotalSpend"
FROM OPCH T0
INNER JOIN OCRD T1 ON T0."CardCode" = T1."CardCode"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N'
GROUP BY T1."CardName"
ORDER BY SUM(T0."DocTotal") DESC;

-- 16. Inventory by Warehouse
SELECT
    T1."WhsName" AS "Warehouse",
    SUM(T0."OnHand" * T2."AvgPrice") AS "StockValue"
FROM OITW T0
INNER JOIN OWHS T1 ON T0."WhsCode" = T1."WhsCode"
INNER JOIN OITM T2 ON T0."ItemCode" = T2."ItemCode"
WHERE T2."InvntItem" = 'Y'
GROUP BY T1."WhsName"
ORDER BY SUM(T0."OnHand" * T2."AvgPrice") DESC;

-- 17. Payment Methods Distribution
SELECT
    T1."PymntGroup" AS "PaymentMethod",
    COUNT(T0."DocEntry") AS "Count",
    SUM(T0."DocTotal") AS "Amount"
FROM OINV T0
INNER JOIN OCTG T1 ON T0."GroupNum" = T1."GroupNum"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N'
GROUP BY T1."PymntGroup";

-- 18. Customer Segments
SELECT
    T0."GroupCode",
    T1."GroupName" AS "Segment",
    COUNT(T0."CardCode") AS "CustomerCount",
    SUM(T2."DocTotal") AS "TotalRevenue"
FROM OCRD T0
INNER JOIN OCRG T1 ON T0."GroupCode" = T1."GroupCode"
LEFT JOIN OINV T2 ON T0."CardCode" = T2."CardCode"
WHERE T0."CardType" = 'C'
GROUP BY T0."GroupCode", T1."GroupName";

-- 19. Open Purchase Orders
SELECT
    T0."DocNum",
    T1."CardName" AS "Vendor",
    T0."DocDate",
    T0."DocDueDate",
    T0."DocTotal",
    T0."DocStatus"
FROM OPOR T0
INNER JOIN OCRD T1 ON T0."CardCode" = T1."CardCode"
WHERE T0."DocStatus" = 'O'
AND T0."CANCELED" = 'N'
ORDER BY T0."DocDueDate";

-- 20. Profit by Product Line
SELECT
    T1."ItmsGrpNam" AS "ProductLine",
    SUM(T0."LineTotal") AS "Revenue",
    SUM(T0."GrssProfit") AS "GrossProfit",
    (SUM(T0."GrssProfit") / SUM(T0."LineTotal") * 100) AS "MarginPercent"
FROM INV1 T0
INNER JOIN OITM T2 ON T0."ItemCode" = T2."ItemCode"
INNER JOIN OITB T1 ON T2."ItmsGrpCod" = T1."ItmsGrpCod"
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
GROUP BY T1."ItmsGrpNam"
ORDER BY SUM(T0."GrssProfit") DESC;

*/

// ===== Simulated Data for Dashboard =====
const simulatedData = {
    // Recent Orders
    recentOrders: [
        { orderNum: 'SO-10245', customer: 'Acme Corporation', date: '2026-02-18', amount: 12500, status: 'Completed' },
        { orderNum: 'SO-10244', customer: 'Tech Solutions Ltd', date: '2026-02-18', amount: 8750, status: 'Processing' },
        { orderNum: 'SO-10243', customer: 'Global Industries', date: '2026-02-17', amount: 15200, status: 'Pending' },
        { orderNum: 'SO-10242', customer: 'Prime Retail Inc', date: '2026-02-17', amount: 6800, status: 'Completed' },
        { orderNum: 'SO-10241', customer: 'Metro Systems', date: '2026-02-16', amount: 9450, status: 'Processing' },
        { orderNum: 'SO-10240', customer: 'Alpha Enterprises', date: '2026-02-16', amount: 11200, status: 'Completed' },
        { orderNum: 'SO-10239', customer: 'Beta Corp', date: '2026-02-15', amount: 7300, status: 'Cancelled' },
        { orderNum: 'SO-10238', customer: 'Delta Group', date: '2026-02-15', amount: 18900, status: 'Completed' }
    ],

    // Low Stock Items
    lowStockItems: [
        { itemCode: 'ITM-001', description: 'Laptop Pro X 15"', inStock: 5, reorderLevel: 20 },
        { itemCode: 'ITM-015', description: 'Wireless Mouse Pro', inStock: 12, reorderLevel: 50 },
        { itemCode: 'ITM-023', description: 'USB-C Hub 7-Port', inStock: 8, reorderLevel: 30 },
        { itemCode: 'ITM-045', description: 'Monitor Stand Adjustable', inStock: 3, reorderLevel: 15 },
        { itemCode: 'ITM-067', description: 'Mechanical Keyboard RGB', inStock: 15, reorderLevel: 40 },
        { itemCode: 'ITM-089', description: 'Webcam HD 1080p', inStock: 7, reorderLevel: 25 }
    ],

    // Alerts
    alerts: [
        { type: 'danger', icon: 'fa-exclamation-circle', title: 'Critical Stock Level', message: '5 items below minimum stock level require immediate attention' },
        { type: 'warning', icon: 'fa-clock', title: 'Overdue Invoices', message: '12 invoices are overdue by more than 30 days totaling $45,200' },
        { type: 'warning', icon: 'fa-truck', title: 'Delayed Shipments', message: '3 purchase orders have delayed delivery dates' },
        { type: 'info', icon: 'fa-info-circle', title: 'System Maintenance', message: 'Scheduled maintenance on Feb 20, 2026 at 2:00 AM' },
        { type: 'warning', icon: 'fa-user-clock', title: 'Pending Approvals', message: '8 documents waiting for your approval' }
    ],

    // Activities
    activities: [
        { type: 'sales', action: 'New Order Created', details: 'SO-10245 for Acme Corporation - $12,500', time: '5 mins ago' },
        { type: 'inventory', action: 'Stock Received', details: 'GR-5678 from Tech Supplies Inc - 150 items', time: '25 mins ago' },
        { type: 'finance', action: 'Payment Received', details: 'INV-8956 paid by Global Industries - $15,200', time: '1 hour ago' },
        { type: 'sales', action: 'Quote Approved', details: 'QT-3421 converted to Sales Order', time: '2 hours ago' },
        { type: 'system', action: 'User Login', details: 'John Smith logged in from 192.168.1.105', time: '3 hours ago' },
        { type: 'inventory', action: 'Stock Transfer', details: 'Transfer from Main to North Branch - 45 items', time: '4 hours ago' },
        { type: 'finance', action: 'Invoice Created', details: 'INV-9012 for Metro Systems - $9,450', time: '5 hours ago' }
    ],

    // Inventory Items for Table
    inventoryItems: [
        { itemCode: 'ITM-001', description: 'Laptop Pro X 15"', category: 'Electronics', warehouse: 'Main', inStock: 45, reserved: 12, available: 33, unitPrice: 1299.99, totalValue: 58499.55 },
        { itemCode: 'ITM-002', description: 'Desktop Workstation', category: 'Electronics', warehouse: 'Main', inStock: 28, reserved: 5, available: 23, unitPrice: 1899.99, totalValue: 53199.72 },
        { itemCode: 'ITM-003', description: 'Office Chair Ergonomic', category: 'Furniture', warehouse: 'North', inStock: 120, reserved: 35, available: 85, unitPrice: 459.99, totalValue: 55198.80 },
        { itemCode: 'ITM-004', description: 'Standing Desk Electric', category: 'Furniture', warehouse: 'Main', inStock: 65, reserved: 20, available: 45, unitPrice: 699.99, totalValue: 45499.35 },
        { itemCode: 'ITM-005', description: 'Monitor 27" 4K', category: 'Electronics', warehouse: 'South', inStock: 88, reserved: 15, available: 73, unitPrice: 549.99, totalValue: 48399.12 },
        { itemCode: 'ITM-006', description: 'Wireless Keyboard', category: 'Electronics', warehouse: 'Main', inStock: 250, reserved: 40, available: 210, unitPrice: 89.99, totalValue: 22497.50 },
        { itemCode: 'ITM-007', description: 'Printer Laser Color', category: 'Electronics', warehouse: 'East', inStock: 35, reserved: 8, available: 27, unitPrice: 399.99, totalValue: 13999.65 },
        { itemCode: 'ITM-008', description: 'Filing Cabinet 4-Drawer', category: 'Furniture', warehouse: 'West', inStock: 42, reserved: 10, available: 32, unitPrice: 289.99, totalValue: 12179.58 }
    ],

    // KPI Data
    kpis: {
        totalRevenue: 1284500,
        totalOrders: 842,
        newCustomers: 156,
        grossProfit: 385200,
        inventoryValue: 2456800,
        pendingOrders: 47,
        accountsReceivable: 458200,
        accountsPayable: 312800
    },

    // Sales Trend Data
    salesTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenue: [185000, 195000, 210000, 225000, 198000, 245000, 268000, 285000, 292000, 310000, 325000, 358000],
        lastYearRevenue: [165000, 172000, 185000, 192000, 178000, 205000, 225000, 238000, 245000, 268000, 285000, 298000],
        orders: [142, 158, 165, 172, 155, 188, 195, 210, 225, 238, 252, 268],
        profit: [55000, 58000, 62000, 68000, 59000, 72000, 78000, 85000, 88000, 95000, 102000, 112000]
    },

    // Category Sales
    categorySales: [
        { category: 'Electronics', percentage: 35, amount: 449575 },
        { category: 'Furniture', percentage: 25, amount: 321125 },
        { category: 'Office Supplies', percentage: 15, amount: 192675 },
        { category: 'Hardware', percentage: 12, amount: 154140 },
        { category: 'Software', percentage: 8, amount: 102760 },
        { category: 'Services', percentage: 5, amount: 64225 }
    ],

    // Top Products
    topProducts: [
        { name: 'Laptop Pro X', units: 245, revenue: 318255 },
        { name: 'Office Chair Ergonomic', units: 198, revenue: 91078 },
        { name: 'Wireless Mouse Pro', units: 187, revenue: 16829 },
        { name: 'Monitor 27" 4K', units: 165, revenue: 90748 },
        { name: 'Desk Lamp LED', units: 142, revenue: 8519 }
    ],

    // Regional Sales
    regionalSales: [
        { region: 'North', percentage: 32, amount: 411040 },
        { region: 'South', percentage: 28, amount: 359660 },
        { region: 'East', percentage: 22, amount: 282590 },
        { region: 'West', percentage: 18, amount: 231210 }
    ],

    // Sales Reps Performance
    salesReps: [
        { name: 'John Smith', sales: 125000, target: 100000, orders: 85 },
        { name: 'Jane Doe', sales: 118000, target: 100000, orders: 78 },
        { name: 'Mike Johnson', sales: 98000, target: 90000, orders: 65 },
        { name: 'Sarah Williams', sales: 87000, target: 85000, orders: 58 },
        { name: 'David Brown', sales: 72000, target: 80000, orders: 48 }
    ],

    // Accounts Receivable Aging
    arAging: [
        { period: 'Current', amount: 185000 },
        { period: '1-30 Days', amount: 125000 },
        { period: '31-60 Days', amount: 78000 },
        { period: '61-90 Days', amount: 42000 },
        { period: '90+ Days', amount: 28200 }
    ],

    // Top Vendors
    topVendors: [
        { name: 'Tech Supplies Inc', spend: 85000, orders: 45 },
        { name: 'Office Pro Distributors', spend: 72000, orders: 38 },
        { name: 'Hardware Direct', spend: 58000, orders: 32 },
        { name: 'Global Parts Co', spend: 45000, orders: 28 },
        { name: 'Quick Ship Logistics', spend: 38000, orders: 22 }
    ],

    // Top Customers
    topCustomers: [
        { name: 'Acme Corporation', revenue: 125000, orders: 42 },
        { name: 'Tech Solutions Ltd', revenue: 98000, orders: 35 },
        { name: 'Global Industries', revenue: 85000, orders: 28 },
        { name: 'Prime Retail Inc', revenue: 72000, orders: 25 },
        { name: 'Metro Systems', revenue: 65000, orders: 22 }
    ],

    // Warehouse Stock
    warehouseStock: [
        { warehouse: 'Main Warehouse', value: 850000, items: 1245 },
        { warehouse: 'North Branch', value: 320000, items: 456 },
        { warehouse: 'South Branch', value: 280000, items: 389 },
        { warehouse: 'East Branch', value: 245000, items: 312 },
        { warehouse: 'West Branch', value: 195000, items: 254 }
    ]
};

// ===== Data Fetch Functions (Simulated) =====
// In production, these would make actual API calls to a backend service
// that queries the SAP B1 HANA database

async function fetchDashboardData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return simulatedData;
}

async function fetchSalesData(startDate, endDate) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        trend: simulatedData.salesTrend,
        categories: simulatedData.categorySales,
        topProducts: simulatedData.topProducts,
        regional: simulatedData.regionalSales
    };
}

async function fetchInventoryData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        items: simulatedData.inventoryItems,
        lowStock: simulatedData.lowStockItems,
        warehouses: simulatedData.warehouseStock
    };
}

async function fetchFinanceData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        kpis: simulatedData.kpis,
        arAging: simulatedData.arAging
    };
}

async function fetchPurchasingData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        vendors: simulatedData.topVendors
    };
}

async function fetchCustomerData() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        topCustomers: simulatedData.topCustomers
    };
}

// ===== SAP B1 Connection Handler =====
// This class would handle the actual connection to SAP B1 in production

class SAPB1Connection {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
        this.sessionId = null;
    }

    async connect() {
        // In production, this would:
        // 1. Establish connection to SAP B1 Service Layer
        // 2. Authenticate and get session token
        // 3. Store session for subsequent requests

        console.log('Connecting to SAP B1...', this.config.server);

        // Simulated connection
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.isConnected = true;
        this.sessionId = 'session_' + Date.now();

        return { success: true, sessionId: this.sessionId };
    }

    async disconnect() {
        // Logout from SAP B1 Service Layer
        this.isConnected = false;
        this.sessionId = null;
        return { success: true };
    }

    async executeQuery(sql) {
        if (!this.isConnected) {
            throw new Error('Not connected to SAP B1');
        }

        // In production, this would execute the SQL query against SAP B1 HANA
        console.log('Executing query:', sql);

        // Return simulated results
        await new Promise(resolve => setTimeout(resolve, 200));
        return { success: true, data: [] };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        simulatedData,
        fetchDashboardData,
        fetchSalesData,
        fetchInventoryData,
        fetchFinanceData,
        fetchPurchasingData,
        fetchCustomerData,
        SAPB1Connection
    };
}

