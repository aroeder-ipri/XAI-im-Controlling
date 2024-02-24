/* globals Chart:false */

(() => {
    'use strict';
  
    // Graphs
    const lineCtx = document.getElementById('lineChart');
    const barCtx = document.getElementById('barChart');

    // Line Chart Konfiguration
    const lineChartConfig = {
        type: 'line',
        data: {
            labels: [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ],
            datasets: [{
                data: [
                    15339,
                    21345,
                    18483,
                    24003,
                    23489,
                    24092,
                    12034
                ],
                lineTension: 0,
                backgroundColor: 'ccc',
                borderColor: 'ececec',
                borderWidth: 4,
                pointBackgroundColor: '#ffffff'
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    boxPadding: 3
                }
            }
        }
    };

    // Balkendiagramm Konfiguration
    const barChartConfig = {
        type: 'bar',
        data: {
            labels: ['2019', '2020', '2021', '2022', '2023'],
            datasets: [{
                label: 'Jahresumsatz',
                data: [50000, 60000, 75000, 90000, 100000],
                backgroundColor: 'transparent',
                borderColor: 'fff',
                borderWidth: 4,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    boxPadding: 3
                }
            }
        }
    };

    // Line Chart initialisieren
    const lineChart = new Chart(lineCtx, lineChartConfig);

    // Balkendiagramm initialisieren
    const barChart = new Chart(barCtx, barChartConfig);
})();
