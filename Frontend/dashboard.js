/* globals Chart:false */

(() => {
    'use strict';

    // Graphs
    const lineCtx = document.getElementById('lineChart');
    const lineCtx2 = document.getElementById('lineChart2');
    const barCtx = document.getElementById('barChart');
    let csvData;
    let csvDataWithCondition;
    let lineChart;
    let lineChart2;
    let barChart;
    let vorhersageWert = 0; // Initialisierung des Vorhersage-Werts

    // Funktion zum Laden der CSV-Datei
    async function loadCSV(url) {
        const response = await fetch(url);
        const data = await response.text();
        return data;
    }

    // Funktion zum Analysieren der CSV-Daten und Extrahieren der Werte mit der Bedingung
    function parseCSVWithCondition(csv) {
        const lines = csv.split('\n');
        const data = {};

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(';');
            if (parts.length >= 4 && parts[3].trim() === '0') {
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

    // Funktion zum Analysieren der CSV-Daten und Extrahieren aller Werte
    function parseCSVAll(csv) {
        const lines = csv.split('\n');
        const data = {};

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(';');
            const store = parts[0].trim();
            const month = parts[2].trim();
            const value = parseInt(parts[1]);

            if (!data[store]) {
                data[store] = {};
            }

            data[store][month] = value;
        }

        return data;
    }

    // Event-Listener für den Anzeigen-Button
    document.getElementById('anzeigenButton').addEventListener('click', function () {
        vorhersageWert = 1;
        document.getElementById('vorhersageAnzeigen').textContent = vorhersageWert;
    });


    // Event-Listener für den Ausblenden-Button
    document.getElementById('ausblendenButton').addEventListener('click', function () {
        vorhersageWert = 0;
        document.getElementById('vorhersageAnzeigen').textContent = vorhersageWert;
    });

    // Funktion zum Erstellen der Checkboxen basierend auf den Stores aus der CSV-Datei
    function createCheckboxes(stores) {
        const checkboxContainer = document.getElementById('storeCheckboxContainer');
        checkboxContainer.innerHTML = '';

        stores.forEach((store, index) => {
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

            // Setze die erste Checkbox als standardmäßig ausgewählt
            if (index === 0) {
                checkboxInput.checked = true;
            }
        });
    }

    // Event-Listener für Änderungen in den Checkboxen
    function updateChartWithSelectedStores() {
        const selectedStores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const filteredData = {};
        const filteredDataWithCondition = {};

        for (const store in csvData) {
            if (selectedStores.includes(store)) {
                filteredData[store] = csvData[store];
            }
        }

        for (const store in csvDataWithCondition) {
            if (selectedStores.includes(store)) {
                filteredDataWithCondition[store] = csvDataWithCondition[store];
            }
        }

        if (vorhersageWert === 0) {
            lineCtx.style.display = 'block';
            lineCtx2.style.display = 'none';
            updateGraphWithCSVData(filteredDataWithCondition, lineChart); // Daten für den ersten Line-Chart aktualisieren
        } else {
            lineCtx.style.display = 'none';
            lineCtx2.style.display = 'block';
            updateGraphWithCSVData(filteredData, lineChart2); // Daten für den zweiten Line-Chart aktualisieren
        }
    }

    // Funktion zum Aktualisieren des Graphen mit CSV-Daten
    function updateGraphWithCSVData(data, chart) {
        const labels = Object.keys(data[Object.keys(data)[0]]);
        const datasets = [];

        for (const store in data) {
            const values = [];
            for (const label of labels) {
                values.push(data[store][label] || 0);
            }

            datasets.push({
                label: store,
                data: values,
                lineTension: 0,
                backgroundColor: 'transparent',
                borderColor: ['grey','grey','grey','grey','grey','grey','grey','grey','grey','grey','grey','red'],
                borderWidth: 2,
                pointBackgroundColor: '#ffffff'
            });
        }

        chart.data.labels = labels;
        chart.data.datasets = datasets;
        chart.update();
    }

    // Funktion, um eine zufällige Farbe zu generieren
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }



    // CSV-Datei laden und Checkboxen erstellen
    loadCSV('fiktiv.csv')
        .then(csv => {
            csvDataWithCondition = parseCSVWithCondition(csv); // Für den ersten Chart nur Daten mit Bedingung laden
            csvData = parseCSVAll(csv); // Für den zweiten Chart alle Daten laden
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

            // Zweiten Line Chart initialisieren
            lineChart2 = new Chart(lineCtx2, {
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
                            boxPadding: 20,
                            callbacks: {
                                label: function(tooltipItem, data) {
                        return ["Einflussfaktoren:","- Nachfrage aus dem Ausland", "- Umfang der Rabattaktionen"];
                    }
                            }
                        }
                    }
                }
            });

            // Funktion zum Anzeigen des benutzerdefinierten Modalfensters mit Informationen
function showModalWithInfo(infoText) {
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modal-text');
    modalText.textContent = infoText;
    modal.style.display = 'block';

    // Schließen-Schaltfläche
    const closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    // Klicken außerhalb des Modalfensters, um es zu schließen
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// Funktion zum Anzeigen von näheren Informationen beim Klicken auf das Balkendiagramm
function showBarChartInfo(event, chart) {
    const activePoints = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);

    if (activePoints.length > 0) {
        const firstPoint = activePoints[0];
        const data = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];

        // Benutzerdefiniertes Modalfenster anzeigen und Informationen einfügen
        showModalWithInfo("Nachfolgend ist zu sehen, welche Einflussfaktoren den größten Einfluss auf die Umsatzprognose hatten:");
    }
}

// Funktion zum Öffnen des zweiten Modalfensters
document.getElementById('mehrButton').addEventListener('click', function() {
    document.getElementById('modal2').style.display = 'block';
});

// Funktion zum Schließen des zweiten Modalfensters
function closeModal2() {
    document.getElementById('modal2').style.display = 'none';
}

// Eventlistener für den zweiten Close-Button im zweiten Modalfenster
const closeBtn2 = document.querySelector('#modal2 .close');
closeBtn2.addEventListener('click', closeModal2);

// Funktion zum Schließen des zweiten Modalfensters bei Klick außerhalb des Fensters
window.onclick = function(event) {
    const modal2 = document.getElementById('modal2');
    if (event.target == modal2) {
        modal2.style.display = 'none';
    }
}


// Balkendiagramm initialisieren
barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: ['2019', '2020', '2021', '2022', '2023'],
        datasets: [{
            label: 'Jahresumsatz',
            data: [50000, 60000, 75000, 90000, 100000],
            backgroundColor: ['red', 'orange', 'yellow', 'green', 'blue'], // Unterschiedliche Farben für die Balken
            borderColor: 'transparent',
            borderWidth: 1,
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
        },
        onClick: function(event, elements) {
            showBarChartInfo(event, this);
        }
    }
});


            // Rufe die Funktion zum Aktualisieren des Graphen mit den vorausgewählten Stores auf
            updateChartWithSelectedStores();
        });
})();
