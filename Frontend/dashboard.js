/* globals Chart:false */

(() => {
    'use strict';

    // Graphs
    const lineCtx = document.getElementById('lineChart');
    const barCtx = document.getElementById('barChart');
    let csvData;
    let lineChart;
    let barChart;

    // Funktion zum Laden der CSV-Datei
    async function loadCSV(url) {
        const response = await fetch(url);
        const data = await response.text();
        return data;
    }

    // Funktion zum Analysieren der CSV-Daten und Extrahieren der Werte
    function parseCSV(csv) {
        const lines = csv.split('\n');
        const data = {};

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(';');
            if (parts.length >= 3) {
                const store = parts[0].trim();
                const month = parts[2].trim();
                const value = parseInt(parts[1]);

                if (!data[store]) {
                    data[store] = {};
                }

                data[store][month] = value;
            }
        }

        return data;
    }

    // Funktion zum Erstellen der Checkboxen basierend auf den Stores aus der CSV-Datei
    function createCheckboxes(stores) {
        const checkboxContainer = document.getElementById('storeCheckboxContainer');
        checkboxContainer.innerHTML = ''; // Clear previous checkboxes

        stores.forEach(store => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.classList.add('form-check');

            const checkboxInput = document.createElement('input');
            checkboxInput.classList.add('form-check-input');
            checkboxInput.type = 'checkbox';
            checkboxInput.value = store;
            checkboxInput.id = `${store}Checkbox`;
            checkboxInput.addEventListener('change', updateChartWithSelectedStores);

            const checkboxLabel = document.createElement('label');
            checkboxLabel.classList.add('form-check-label');
            checkboxLabel.htmlFor = `${store}Checkbox`;
            checkboxLabel.textContent = store;

            checkboxDiv.appendChild(checkboxInput);
            checkboxDiv.appendChild(checkboxLabel);

            checkboxContainer.appendChild(checkboxDiv);
        });
    }

    // Event-Listener für Änderungen in den Checkboxen
    function updateChartWithSelectedStores() {
        const selectedStores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const filteredData = {};

        for (const store in csvData) {
            if (selectedStores.includes(store)) {
                filteredData[store] = csvData[store];
            }
        }

        updateGraphWithCSVData(filteredData);
    }

    // Funktion zum Aktualisieren des Graphen mit CSV-Daten
    function updateGraphWithCSVData(data) {
        const labels = Object.keys(data[Object.keys(data)[0]]); // Verwende die Labels des ersten Stores
        const datasets = [];

        for (const store in data) {
            const values = [];
            for (const label of labels) {
                values.push(data[store][label] || 0); // Füge den Wert hinzu oder 0, falls kein Wert vorhanden ist
            }

            datasets.push({
                label: store,
                data: values,
                lineTension: 0,
                backgroundColor: '#62635f',
                borderColor: '#62635f',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff'
            });
        }

        lineChart.data.labels = labels;
        lineChart.data.datasets = datasets;
        lineChart.update();
    }

    // CSV-Datei laden und Checkboxen erstellen
    loadCSV('fiktiv.csv')
        .then(csv => {
            csvData = parseCSV(csv);
            const stores = Object.keys(csvData);
            createCheckboxes(stores);

            // Line Chart initialisieren
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            boxPadding: 3
                        }
                    }
                }
            });

            // Balkendiagramm initialisieren
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['2019', '2020', '2021', '2022', '2023'],
                    datasets: [{
                        label: 'Jahresumsatz',
                        data: [50000, 60000, 75000, 90000, 100000],
                        backgroundColor: '#62635f',
                        borderColor: 'transparent',
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
            });
        });
})();
