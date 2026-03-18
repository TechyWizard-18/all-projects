// ===== SAP Business One Dashboard - Charts Configuration =====

// Chart.js default configuration
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Prevent chart resize observer issues - critical for preventing infinite growth
Chart.defaults.resizeDelay = 200;

// Disable animations on resize to prevent lag and infinite loops
Chart.defaults.animation = {
    duration: 300,
    resize: {
        duration: 0
    }
};
Chart.defaults.transitions = {
    resize: {
        animation: {
            duration: 0
        }
    },
    active: {
        animation: {
            duration: 200
        }
    }
};

// Disable observer to prevent infinite resize loops
Chart.defaults.devicePixelRatio = 1;

// Color palettes
const colors = {
    primary: '#0070c0',
    secondary: '#00a1e0',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    purple: '#6f42c1',
    pink: '#e83e8c',
    orange: '#fd7e14',
    teal: '#20c997',
    gradient1: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)'],
    gradient2: ['rgba(17, 153, 142, 0.8)', 'rgba(56, 239, 125, 0.8)'],
    chartColors: [
        'rgba(0, 112, 192, 0.8)',
        'rgba(0, 161, 224, 0.8)',
        'rgba(40, 167, 69, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(220, 53, 69, 0.8)',
        'rgba(111, 66, 193, 0.8)',
        'rgba(253, 126, 20, 0.8)',
        'rgba(32, 201, 151, 0.8)'
    ]
};

// Chart instances storage
const charts = {};

// Common chart options to prevent infinite growth
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 300
    },
    layout: {
        padding: 5
    },
    onResize: function(chart, size) {
        // Prevent chart from growing beyond container
        const container = chart.canvas.parentElement;
        if (container && size.height > container.clientHeight) {
            chart.resize(size.width, container.clientHeight);
        }
    }
};

// Helper function to merge options with common options
function getChartOptions(customOptions) {
    return {
        ...commonChartOptions,
        ...customOptions,
        plugins: {
            ...(commonChartOptions.plugins || {}),
            ...(customOptions.plugins || {})
        }
    };
}

// ===== Dashboard Charts =====
function initializeDashboardCharts() {
    createSalesTrendChart();
    createCategoryChart();
    createTopProductsChart();
    createRegionalChart();
    createPaymentChart();
}

function createSalesTrendChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (charts.salesTrend) {
        charts.salesTrend.destroy();
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    charts.salesTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue',
                data: [185000, 195000, 210000, 225000, 198000, 245000, 268000, 285000, 292000, 310000, 325000, 358000],
                borderColor: colors.primary,
                backgroundColor: 'rgba(0, 112, 192, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Last Year',
                data: [165000, 172000, 185000, 192000, 178000, 205000, 225000, 238000, 245000, 268000, 285000, 298000],
                borderColor: colors.secondary,
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 3
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    },
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (charts.category) {
        charts.category.destroy();
    }

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Electronics', 'Furniture', 'Office Supplies', 'Hardware', 'Software', 'Services'],
            datasets: [{
                data: [35, 25, 15, 12, 8, 5],
                backgroundColor: colors.chartColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${percentage}%`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function createTopProductsChart() {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;

    if (charts.topProducts) {
        charts.topProducts.destroy();
    }

    charts.topProducts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Laptop Pro X', 'Office Chair', 'Wireless Mouse', 'Monitor 27"', 'Desk Lamp'],
            datasets: [{
                label: 'Units Sold',
                data: [245, 198, 187, 165, 142],
                backgroundColor: colors.chartColors.slice(0, 5),
                borderRadius: 5,
                barThickness: 40
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createRegionalChart() {
    const ctx = document.getElementById('regionalChart');
    if (!ctx) return;

    if (charts.regional) {
        charts.regional.destroy();
    }

    charts.regional = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['North', 'South', 'East', 'West', 'Central'],
            datasets: [{
                data: [32, 28, 22, 18, 15],
                backgroundColor: [
                    'rgba(0, 112, 192, 0.7)',
                    'rgba(0, 161, 224, 0.7)',
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(111, 66, 193, 0.7)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true
                    }
                }
            },
            scales: {
                r: {
                    display: false
                }
            }
        }
    });
}

function createPaymentChart() {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;

    if (charts.payment) {
        charts.payment.destroy();
    }

    charts.payment = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Credit Card', 'Bank Transfer', 'Cash', 'Check', 'PayPal'],
            datasets: [{
                data: [42, 28, 15, 10, 5],
                backgroundColor: colors.chartColors.slice(0, 5),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// ===== Sales Analytics Charts =====
function initializeSalesCharts() {
    createSalesRepChart();
}

function createSalesRepChart() {
    const ctx = document.getElementById('salesRepChart');
    if (!ctx) return;

    if (charts.salesRep) {
        charts.salesRep.destroy();
    }

    charts.salesRep = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'David Brown'],
            datasets: [{
                label: 'Sales Amount',
                data: [125000, 118000, 98000, 87000, 72000],
                backgroundColor: colors.primary,
                borderRadius: 5
            }, {
                label: 'Target',
                data: [100000, 100000, 90000, 85000, 80000],
                backgroundColor: 'rgba(200, 200, 200, 0.5)',
                borderRadius: 5
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

// ===== Inventory Charts =====
function initializeInventoryCharts() {
    createWarehouseChart();
    createTurnoverChart();
    createStockAgeChart();
    populateInventoryTable();
}

function createWarehouseChart() {
    const ctx = document.getElementById('warehouseChart');
    if (!ctx) return;

    if (charts.warehouse) {
        charts.warehouse.destroy();
    }

    charts.warehouse = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Main Warehouse', 'North Branch', 'South Branch', 'East Branch', 'West Branch'],
            datasets: [{
                label: 'Stock Value ($)',
                data: [850000, 320000, 280000, 245000, 195000],
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.success,
                    colors.warning,
                    colors.info
                ],
                borderRadius: 8
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function createTurnoverChart() {
    const ctx = document.getElementById('turnoverChart');
    if (!ctx) return;

    if (charts.turnover) {
        charts.turnover.destroy();
    }

    charts.turnover = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Turnover Rate',
                data: [4.2, 4.5, 4.8, 5.1, 4.9, 5.3],
                borderColor: colors.success,
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Times/Month'
                    }
                }
            }
        }
    });
}

function createStockAgeChart() {
    const ctx = document.getElementById('stockAgeChart');
    if (!ctx) return;

    if (charts.stockAge) {
        charts.stockAge.destroy();
    }

    charts.stockAge = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['0-30 days', '31-60 days', '61-90 days', '90+ days'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: [
                    colors.success,
                    colors.info,
                    colors.warning,
                    colors.danger
                ],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true
                    }
                }
            },
            cutout: '55%'
        }
    });
}

function populateInventoryTable() {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;

    const items = simulatedData.inventoryItems;

    tableBody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.itemCode}</strong></td>
            <td>${item.description}</td>
            <td>${item.category}</td>
            <td>${item.warehouse}</td>
            <td>${item.inStock}</td>
            <td>${item.reserved}</td>
            <td>${item.available}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>$${item.totalValue.toLocaleString()}</td>
        </tr>
    `).join('');
}

// ===== Finance Charts =====
function initializeFinanceCharts() {
    createRevenueExpenseChart();
    createARAgingChart();
    createExpenseBreakdownChart();
    createProfitMarginChart();
}

function createRevenueExpenseChart() {
    const ctx = document.getElementById('revenueExpenseChart');
    if (!ctx) return;

    if (charts.revenueExpense) {
        charts.revenueExpense.destroy();
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    charts.revenueExpense = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue',
                data: [185000, 195000, 210000, 225000, 198000, 245000, 268000, 285000, 292000, 310000, 325000, 358000],
                backgroundColor: colors.success,
                borderRadius: 4
            }, {
                label: 'Expenses',
                data: [145000, 155000, 165000, 172000, 158000, 188000, 205000, 218000, 225000, 238000, 252000, 275000],
                backgroundColor: colors.danger,
                borderRadius: 4
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function createARAgingChart() {
    const ctx = document.getElementById('arAgingChart');
    if (!ctx) return;

    if (charts.arAging) {
        charts.arAging.destroy();
    }

    charts.arAging = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
            datasets: [{
                label: 'Amount',
                data: [185000, 125000, 78000, 42000, 28200],
                backgroundColor: [
                    colors.success,
                    colors.info,
                    colors.warning,
                    colors.orange,
                    colors.danger
                ],
                borderRadius: 5
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Amount: $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function createExpenseBreakdownChart() {
    const ctx = document.getElementById('expenseBreakdownChart');
    if (!ctx) return;

    if (charts.expenseBreakdown) {
        charts.expenseBreakdown.destroy();
    }

    charts.expenseBreakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cost of Goods', 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Other'],
            datasets: [{
                data: [45, 25, 12, 8, 6, 4],
                backgroundColor: colors.chartColors,
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 10
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function createProfitMarginChart() {
    const ctx = document.getElementById('profitMarginChart');
    if (!ctx) return;

    if (charts.profitMargin) {
        charts.profitMargin.destroy();
    }

    charts.profitMargin = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Electronics', 'Furniture', 'Office Supplies', 'Hardware', 'Software'],
            datasets: [{
                label: 'Profit Margin %',
                data: [28, 35, 42, 25, 55],
                backgroundColor: colors.chartColors.slice(0, 5),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Margin: ' + context.raw + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 60,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// ===== Purchasing Charts =====
function initializePurchasingCharts() {
    createTopVendorsChart();
    createPOStatusChart();
    createProcurementTrendChart();
}

function createTopVendorsChart() {
    const ctx = document.getElementById('topVendorsChart');
    if (!ctx) return;

    if (charts.topVendors) {
        charts.topVendors.destroy();
    }

    charts.topVendors = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tech Supplies Inc', 'Office Pro', 'Hardware Direct', 'Global Parts', 'Quick Ship'],
            datasets: [{
                label: 'Spend ($)',
                data: [85000, 72000, 58000, 45000, 38000],
                backgroundColor: colors.chartColors.slice(0, 5),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Spend: $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function createPOStatusChart() {
    const ctx = document.getElementById('poStatusChart');
    if (!ctx) return;

    if (charts.poStatus) {
        charts.poStatus.destroy();
    }

    charts.poStatus = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Received', 'In Transit', 'Pending', 'Cancelled'],
            datasets: [{
                data: [45, 28, 22, 5],
                backgroundColor: [
                    colors.success,
                    colors.info,
                    colors.warning,
                    colors.danger
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function createProcurementTrendChart() {
    const ctx = document.getElementById('procurementTrendChart');
    if (!ctx) return;

    if (charts.procurementTrend) {
        charts.procurementTrend.destroy();
    }

    charts.procurementTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'PO Amount',
                data: [145000, 158000, 172000, 165000, 188000, 195000],
                borderColor: colors.primary,
                backgroundColor: 'rgba(0, 112, 192, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Amount: $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

// ===== Customer Charts =====
function initializeCustomerCharts() {
    createTopCustomersChart();
    createCustomerSegmentChart();
    createCustomerAcquisitionChart();
}

function createTopCustomersChart() {
    const ctx = document.getElementById('topCustomersChart');
    if (!ctx) return;

    if (charts.topCustomers) {
        charts.topCustomers.destroy();
    }

    charts.topCustomers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Acme Corp', 'Tech Solutions', 'Global Industries', 'Prime Retail', 'Metro Systems'],
            datasets: [{
                label: 'Revenue ($)',
                data: [125000, 98000, 85000, 72000, 65000],
                backgroundColor: colors.chartColors.slice(0, 5),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function createCustomerSegmentChart() {
    const ctx = document.getElementById('customerSegmentChart');
    if (!ctx) return;

    if (charts.customerSegment) {
        charts.customerSegment.destroy();
    }

    charts.customerSegment = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Enterprise', 'Mid-Market', 'Small Business', 'Individual'],
            datasets: [{
                data: [35, 30, 25, 10],
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.success,
                    colors.warning
                ],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true
                    }
                }
            },
            cutout: '55%'
        }
    });
}

function createCustomerAcquisitionChart() {
    const ctx = document.getElementById('customerAcquisitionChart');
    if (!ctx) return;

    if (charts.customerAcquisition) {
        charts.customerAcquisition.destroy();
    }

    charts.customerAcquisition = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'New Customers',
                data: [45, 52, 48, 65, 58, 72],
                borderColor: colors.success,
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Churned',
                data: [12, 8, 15, 10, 13, 9],
                borderColor: colors.danger,
                backgroundColor: 'transparent',
                tension: 0.4
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ===== Chart Button Actions =====
document.querySelectorAll('.chart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const chartType = this.dataset.chart;
        updateSalesTrendData(chartType);
    });
});

function updateSalesTrendData(type) {
    if (!charts.salesTrend) return;

    const datasets = {
        revenue: {
            label: 'Revenue',
            data: [185000, 195000, 210000, 225000, 198000, 245000, 268000, 285000, 292000, 310000, 325000, 358000],
            color: colors.primary
        },
        orders: {
            label: 'Orders',
            data: [142, 158, 165, 172, 155, 188, 195, 210, 225, 238, 252, 268],
            color: colors.success
        },
        profit: {
            label: 'Profit',
            data: [55000, 58000, 62000, 68000, 59000, 72000, 78000, 85000, 88000, 95000, 102000, 112000],
            color: colors.purple
        }
    };

    const selected = datasets[type];
    charts.salesTrend.data.datasets[0].label = selected.label;
    charts.salesTrend.data.datasets[0].data = selected.data;
    charts.salesTrend.data.datasets[0].borderColor = selected.color;
    charts.salesTrend.data.datasets[0].backgroundColor = selected.color.replace(')', ', 0.1)').replace('rgb', 'rgba');
    charts.salesTrend.update();
}

