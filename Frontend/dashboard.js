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
    let storeInfoData; // Globale Variable für Store-Informationen
    let selectedStoreIndex = 0; // Variable zur Verwaltung des aktuellen Store-Index

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

        // Funktion zum Analysieren der CSV-Daten und Extrahieren der Store-Informationen
        function parseStoreInfo(csv) {
            const lines = csv.split('\n');
            const data = {};

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const parts = line.split(';');
                const store = parts[0].trim();
                const storeInfo = parts[4].trim(); // Die 5. Spalte in der CSV-Datei enthält Store-Informationen
                data[store] = storeInfo;
            }

            return data;
        }



// Funktion zum Aktualisieren der Store-Informationen im HTML
function updateStoreInfo(selectedStore, storeInfoData) {
    const storeInfoContainer = document.getElementById('storeInfo');
    const currentStoreElement = document.getElementById('currentStore');
    storeInfoContainer.innerHTML = '';
    
    // Aktuellen Store einfügen
    currentStoreElement.textContent = selectedStore;

    // Store-Informationen einfügen
    const storeInfo = storeInfoData[selectedStore];
    const storeInfoDiv = document.createElement('div');
    storeInfoDiv.textContent = storeInfo;
    storeInfoContainer.appendChild(storeInfoDiv);
}

// Funktion zum Aktualisieren des angezeigten Stores im Carousel
function updateSelectedStore() {
    const stores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    const selectedStore = stores[selectedStoreIndex];
    updateStoreInfo(selectedStore, storeInfoData);
}

// Funktion zum Wechseln zum nächsten Store im Carousel
function nextStore() {
    const stores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    selectedStoreIndex = (selectedStoreIndex + 1) % stores.length;
    updateSelectedStore();
}

// Funktion zum Wechseln zum vorherigen Store im Carousel
function prevStore() {
    const stores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    selectedStoreIndex = (selectedStoreIndex - 1 + stores.length) % stores.length;
    updateSelectedStore();
}

// Event-Listener für die nächste Store-Schaltfläche
document.getElementById('nextStoreButton').addEventListener('click', nextStore);

// Event-Listener für die vorherige Store-Schaltfläche
document.getElementById('prevStoreButton').addEventListener('click', prevStore);






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
        updateStoreInfo(selectedStores, storeInfoData);
        const filteredData = {};
        const filteredDataWithCondition = {};
        updateSelectedStore();

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
            questionButton.style.display = 'none';
            updateGraphWithCSVData(filteredDataWithCondition, lineChart); // Daten für den ersten Line-Chart aktualisieren
        } else {
            lineCtx.style.display = 'none';
            lineCtx2.style.display = 'block';
            questionButton.style.display = 'block';
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

    // CSV-Datei laden und Checkboxen erstellen
    loadCSV('fiktiv.csv')
        .then(csv => {
            csvDataWithCondition = parseCSVWithCondition(csv); // Für den ersten Chart nur Daten mit Bedingung laden
            csvData = parseCSVAll(csv); // Für den zweiten Chart alle Daten laden
            storeInfoData = parseStoreInfo(csv); // Store-Informationen laden
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
                            position: 'top',
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
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
                            position: 'top',
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        },
                        tooltip: {
                            boxPadding: 3
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
            }

            // Funktion zum Schließen des Modalfensters
            function closeModal() {
                document.getElementById('modal').style.display = 'none';
            }

            // Eventlistener für den Close-Button im Modalfenster
            const closeBtn = document.querySelector('#modal .close');
            closeBtn.addEventListener('click', closeModal);

            // Funktion zum Schließen des Modalfensters bei Klick außerhalb des Fensters *funktioniert noch nicht*
            //const modal = document.getElementById('modal');
            //modal.addEventListener('click', function(event) {
            //    if (event.target === modal) {
            //        closeModal();
            //    }
            //});

            // Event-Listener für die Schaltfläche, um das Modalfenster zu öffnen
            document.getElementById('questionButton').addEventListener('click', function() {
                const modal = document.getElementById('modal');
                modal.style.display = 'block';
            });

            // Funktion zum Öffnen des zweiten Modalfensters
            document.getElementById('mehrButton').addEventListener('click', function() {
                document.getElementById('modal2').style.display = 'block';
            });

            // Funktion zum Schließen des zweiten Modalfensters
            function closeModal2() {
                document.getElementById('modal2').style.display = 'none';
                clearInputField(); // Aufruf der Funktion zum Leeren des Eingabefelds
                removeAdditionalText(); // Aufruf der Funktion zum Entfernen des zusätzlichen Texts
            }

            // Eventlistener für den zweiten Close-Button im zweiten Modalfenster
            const closeBtn2 = document.querySelector('#modal2 .close');
            closeBtn2.addEventListener('click', closeModal2);

            // Funktion zum Schließen des zweiten Modalfensters bei Klick außerhalb des Fensters *funktioniert noch nicht*
            //window.onclick = function(event) {
            //    const modal2 = document.getElementById('modal2');
            //    if (event.target == modal2) {
            //        modal2.style.display = 'none';
            //        clearInputField(); // Aufruf der Funktion zum Leeren des Eingabefelds
            //        removeAdditionalText(); // Aufruf der Funktion zum Entfernen des zusätzlichen Texts
            //    }
            //}

            // Event-Listener für den Bestätigen-Button im Modalfenster 2
            document.getElementById('bestaetigenButton').addEventListener('click', function() {
                // Überprüfung, ob der zusätzliche Text bereits vorhanden ist
                if (!document.getElementById('additionalText')) {
                    // Erstellen eines neuen Absatz-Elements für den zusätzlichen Text
                    const additionalText = document.createElement('p');
                    additionalText.id = 'additionalText'; // Setzen einer ID für das zusätzliche Text-Element
                    additionalText.textContent = 'Um den angestrebten Umsatz zu erreichen, müsste eine 10% Rabattaktion bestehen und die Nachfrage aus dem Ausland 15% höher sein.';
                    
                    // Einfügen des zusätzlichen Texts am Ende des Modalfensters 2
                    const modalContent2 = document.querySelector('#modal2 .modal-content');
                    modalContent2.appendChild(additionalText);
                }
            });

            // Funktion zum Leeren des Eingabefelds
            function clearInputField() {
                document.getElementById('zahlInput').value = ''; // Setzen des Wertes auf leer
            }

            // Funktion zum Entfernen des zusätzlichen Texts
            function removeAdditionalText() {
                const additionalText = document.getElementById('additionalText');
                if (additionalText) {
                    additionalText.remove(); // Entfernen des zusätzlichen Texts, falls vorhanden
                }
            }

            // Überprüfung der Eingabe und Aktivierung des Buttons
            document.getElementById('zahlInput').addEventListener('input', function() {
                var eingabeWert = this.value.trim(); // Trimmen von Leerzeichen
                var button = document.getElementById('bestaetigenButton');
                if (eingabeWert && !isNaN(eingabeWert)) { // Überprüfung auf nicht leer und numerisch
                    button.disabled = false;
                } else {
                    button.disabled = true;
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
                        backgroundColor: ['red', 'orange', 'yellow', 'green', 'blue'], // Unterschiedliche Farben für die Balken
                        borderColor: 'transparent',
                        borderWidth: 1,
                        barThickness: 50,
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

            // Rufe die Funktion zum Aktualisieren des Graphen mit den vorausgewählten Stores auf
            updateChartWithSelectedStores();
        });
})();
