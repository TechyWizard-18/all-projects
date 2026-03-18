# SAP Business One Interactive Dashboard

A comprehensive, interactive dashboard for SAP Business One (SAP B1) that provides real-time insights into sales, inventory, finance, purchasing, and customer analytics.

![Dashboard Preview](https://img.shields.io/badge/SAP-Business%20One-blue) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## Features

### 📊 Executive Dashboard
- **KPI Cards**: Real-time metrics for revenue, orders, customers, profit, inventory value, and pending orders
- **Sales Trend Chart**: Interactive line chart comparing current year vs previous year
- **Category Distribution**: Doughnut chart showing sales by product category
- **Top Products**: Horizontal bar chart of best-selling items
- **Regional Sales**: Polar area chart for geographical distribution
- **Payment Methods**: Pie chart showing payment type breakdown
- **Recent Orders Table**: Latest orders with status indicators
- **Low Stock Alerts**: Items requiring immediate attention
- **Activity Feed**: Real-time business activities

### 📈 Sales Analytics
- Sales performance by representative
- Sales funnel visualization
- Date range filtering
- Conversion rate tracking
- Returns analysis

### 📦 Inventory Management
- Stock levels by warehouse
- Inventory turnover metrics
- Stock age analysis
- Complete inventory listing with search
- Low stock and out-of-stock alerts

### 💰 Financial Overview
- Accounts Receivable/Payable tracking
- Revenue vs Expenses comparison
- AR Aging analysis
- Expense breakdown
- Profit margins by product line

### 🛒 Purchasing & Procurement
- Open purchase orders tracking
- Top vendors by spend
- PO status distribution
- Monthly procurement trends

### 👥 Customer Analytics
- Top customers by revenue
- Customer segmentation
- Acquisition and churn tracking
- Retention rate metrics

### 📑 Reports Center
- Quick access to all standard reports
- Sales, Inventory, Finance, and Purchasing reports
- PDF export capability (framework ready)

### ⚙️ Settings
- Database connection configuration
- Theme selection (Light/Dark)
- Auto-refresh interval settings
- Currency preferences

## Installation

1. **Clone or Download** the repository to your local machine

2. **Open** `index.html` in a modern web browser

3. **No server required** - This is a client-side application

## Configuration for SAP B1 Connection

Navigate to **Settings** in the dashboard and configure:

- **Server IP Address**: Your SAP B1 HANA server IP (e.g., `192.168.1.100`)
- **Database Name**: Your company database (e.g., `SBO_CompanyDB`)
- **Username**: SAP B1 database user
- **Password**: Database password
- **Port**: HANA port (default: `30015`)

## SQL Queries Reference

The `data.js` file contains all SQL queries used to fetch data from SAP B1 HANA database. Key queries include:

```sql
-- Total Revenue
SELECT SUM(T0."DocTotal") AS "TotalRevenue"
FROM OINV T0
WHERE T0."DocDate" BETWEEN '[StartDate]' AND '[EndDate]'
AND T0."CANCELED" = 'N';

-- Recent Orders
SELECT TOP 10
    T0."DocNum" AS "OrderNum",
    T1."CardName" AS "Customer",
    T0."DocDate" AS "Date",
    T0."DocTotal" AS "Amount"
FROM ORDR T0
INNER JOIN OCRD T1 ON T0."CardCode" = T1."CardCode"
WHERE T0."CANCELED" = 'N'
ORDER BY T0."DocDate" DESC;
```

See `data.js` for complete query reference.

## Backend Integration

To connect to your actual SAP B1 system, you'll need to:

1. **Set up a backend API** (Node.js, Python, or .NET recommended)
2. **Connect to SAP B1 Service Layer** or directly to HANA
3. **Modify the fetch functions** in `data.js` to call your API endpoints

Example API endpoint structure:
```
GET /api/dashboard/kpis
GET /api/sales/trend?startDate=&endDate=
GET /api/inventory/items
GET /api/finance/ar-aging
GET /api/customers/top
```

## File Structure

```
sap_dashboard/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── app.js          # Main application logic
├── charts.js       # Chart.js configurations
├── data.js         # Simulated data & SQL queries
└── README.md       # Documentation
```

## Dependencies

- **Chart.js** (v4.x) - For all charts and visualizations
- **Font Awesome** (v6.x) - For icons

Both are loaded via CDN, no local installation required.

## Browser Support

- ✅ Google Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Mozilla Firefox
- ✅ Safari

## Customization

### Adding New Charts
1. Add canvas element in `index.html`
2. Create chart function in `charts.js`
3. Call the function in appropriate section initializer

### Modifying Styles
- All colors are defined as CSS variables in `:root`
- Dark theme variables in `[data-theme="dark"]`
- Responsive breakpoints at 1400px, 1200px, 992px, 768px, 576px

### Adding New Sections
1. Add nav item in sidebar
2. Create new section in main content
3. Add navigation handler in `app.js`

## Security Considerations

⚠️ **Important**: This is a frontend-only demonstration. For production:

1. Never store credentials in frontend code
2. Implement proper authentication
3. Use HTTPS for all API calls
4. Implement CORS properly
5. Use environment variables for sensitive data
6. Add input validation and sanitization

## License

This project is provided for educational and demonstration purposes.

## Support

For SAP B1 specific questions, refer to:
- [SAP Business One Help Portal](https://help.sap.com/docs/SAP_BUSINESS_ONE)
- [SAP Community](https://community.sap.com/)

---

**Note**: This dashboard uses simulated data for demonstration. Connect to your SAP B1 instance to see real business data.

