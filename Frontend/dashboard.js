/* globals Chart:false */

(() => {
    'use strict';
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    // Graphs
    const lineCtx = document.getElementById('lineChart');
    const lineCtx2 = document.getElementById('lineChart2');
    const barCtx = document.getElementById('barChart');
    const questionButton = document.getElementById('questionButton'); // Add this line to get the question button
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
            const line = lines[i].trim();
            if (line) { // Ignoriere leere Zeilen
                const parts = line.split(';');

                // Überprüfe, ob genug Elemente vorhanden sind
                if (parts.length < 11) {
                    console.warn(`Zeile ${i + 1} enthält nicht genügend Elemente: ${line}`);
                    continue;
                }

                // Überprüfe, ob die Bedingung erfüllt ist
                if (parts[3].trim() === '0') {
                    const store = parts[0].trim();
                    const month = parts[2].trim();
                    const value = parseFloat(parts[1].trim()); // Nutze parseFloat für bessere Genauigkeit bei Werten

                    if (!data[store]) {
                        data[store] = {};
                    }

                    data[store][month] = value;
                }
            }
        }

        return data;
    }

    // Funktion zum Analysieren der CSV-Daten und Extrahieren aller Werte
    function parseCSVAll(csv) {
        const lines = csv.split('\n');
        const data = {};

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) { // Ignoriere leere Zeilen
                const parts = line.split(';');

                // Überprüfe, ob genug Elemente vorhanden sind
                if (parts.length < 11) {
                    console.warn(`Zeile ${i + 1} enthält nicht genügend Elemente: ${line}`);
                    continue;
                }

                const store = parts[0].trim();
                const sales = parseFloat(parts[1].trim()); // Hier wird der Sales-Wert analysiert
                const month = parts[2].trim();
                // Weitere Felder könnten hier analysiert werden, falls nötig

                if (!data[store]) {
                    data[store] = {};
                }

                data[store][month] = sales;
            }
        }

        return data;
    }

    // Funktion zum Analysieren der CSV-Daten und Extrahieren der Store-Informationen
    function parseStoreInfo(csv) {
        const lines = csv.split('\n');
        const data = {};

        // Gehe durch jede Zeile der CSV-Datei
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // Überspringe leere Zeilen
            if (!line) continue;

            const parts = line.split(';');

            // Überprüfe, ob genügend Spalten vorhanden sind
            if (parts.length < 11) {
                console.warn(`Zeile ${i + 1} enthält nicht genügend Spalten: ${line}`);
                continue;
            }

            const store = parts[0].trim();
            const month = parts[2].trim(); // Monat als Schlüssel für monatliche Daten
            const storeType = parts[5].trim();
            const assortment = parts[6].trim();
            const competitionDistance = parseInt(parts[7].trim(), 10); // Wettbewerbsdistanz
            const promo = parseInt(parts[8].trim(), 10); // Promotionen
            const customers = parseInt(parts[9].trim(), 10); // Kundenanzahl
            const holidaysThisMonth = parseInt(parts[10].trim(), 10); // Feiertage

            // Wenn der Store noch nicht im Datenobjekt existiert, erstelle ein leeres Objekt
            if (!data[store]) {
                data[store] = {
                    storeType: storeType,
                    assortment: assortment,
                    competitionDistance: competitionDistance,
                    promo: promo,
                    monthlyData: {} // Neues Objekt für monatliche Daten
                };
            }

            // Speichere die monatlichen Daten für "Customers" und "HolidaysThisMonth" im "monthlyData"-Objekt
            data[store].monthlyData[month] = {
                customers: customers,
                holidaysThisMonth: holidaysThisMonth,
                promos: promo
            };
        }

        return data;
    }

    function getLastRecordData(storeData) {
        // Überprüfe, ob die monatlichen Daten vorhanden sind
        if (!storeData || !storeData.monthlyData) return null;

        // Alle Monate aus den monatlichen Daten extrahieren
        const months = Object.keys(storeData.monthlyData);

        // Den letzten Monat (letzten Datensatz) auswählen
        const lastMonth = months[months.length - 1];

        // Rückgabe der letzten Datensatz-Daten
        return storeData.monthlyData[lastMonth];
    }

    function updateStoreInfoBox(storeData) {
        if (storeData) {
            // Rufe die Daten des letzten Datensatzes ab
            const lastRecordData = getLastRecordData(storeData);

            if (lastRecordData) {
                const customers = lastRecordData.customers || 0;
                const holidaysThisMonth = lastRecordData.holidaysThisMonth || 0;
                const promo = lastRecordData.promos || 0;

                console.log(`Anzeigen von Daten für den letzten Datensatz:`);
                console.log(`Kunden: ${customers}, Feiertage: ${holidaysThisMonth}, Promotionen: ${promo}`);

                // Aktualisiere die HTML-Elemente mit den letzten Werten
                document.getElementById('customers-value').textContent = customers;
                document.getElementById('holidays-value').textContent = holidaysThisMonth;
                document.getElementById('promo-value').textContent = promo;
            } else {
                console.warn("Kein letzter Datensatz gefunden.");
            }
        } else {
            console.warn("Keine Store-Daten vorhanden.");
        }
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const csvUrl = 'fiktiv.csv'; // Ersetze dies mit dem tatsächlichen Pfad zu deiner CSV-Datei
        const csvData = await loadCSV(csvUrl);

        // Store-Daten aus CSV laden
        const storeInfoData = parseStoreInfo(csvData);

        // Überprüfe die Struktur von storeInfoData in der Konsole
        console.log("Inhalt von storeInfoData:", storeInfoData);

        // Prüfe, ob der Store 'New York' in den Daten vorhanden ist
        // if (storeInfoData['New York']) {
        //     updateStoreInfoBox(storeInfoData['New York']);
        // } else {
        //     console.warn("Store 'New York' nicht gefunden.");
        // }
    });

    // Funktion zum Aktualisieren der Store-Informationen im HTML
    function updateStoreInfo(selectedStore, storeInfoData) {
        const storeInfoContainerLocation = document.getElementById('storeInfo-location');
        const storeInfoContainerDate = document.getElementById('storeInfo-date');
        const storeInfoContainerType = document.getElementById('storeInfo-type');
        const storeInfoContainerAssortment = document.getElementById('storeInfo-assortment');
        const storeInfoContainerDistanceNextStore = document.getElementById('storeInfo-distanceNextStore');
        const storeInfoContainerCustomers = document.getElementById('storeInfo-customers');
        const storeInfoContainerHolidays = document.getElementById('storeInfo-holidays');
        const storeInfoContainerPromotions = document.getElementById('storeInfo-promotion');
        // const currentStoreElement = document.getElementById('currentStore');  // gibt es wohl nicht mehr


        // Store-Informationen einfügen
        const storeInfo = storeInfoData[selectedStore];

        if (storeInfo) {
            // Daten für Location 
            storeInfoContainerLocation.innerHTML = `
                <div style="margin: 0 30px 0 0; justify-content: center" >
                    <p style="margin: 0;">
                        <span style="font-size: 20px; font-weight: bold; color: #004E9D;">${selectedStore}</span> 
                        <span style="font-size: 20px; color: black;"> | Sales Development</span></p>
                </div>
            `;

            // Daten für Date
            storeInfoContainerDate.innerHTML = `
                <div style="margin: 0 30px 0 0; text-align: center;">
                    <p style="margin: 0;">Date: 2021</p>
                </div>
            `;

            // Daten für Store Type
            storeInfoContainerType.innerHTML = `
            <div style="margin: 0 30px 0 0; text-align: center;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #004E9D;">
                    ${storeInfo.storeType}
                </p>
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                    Store Type
                </p>
            </div>
            `;

            // Daten für Assortment
            storeInfoContainerAssortment.innerHTML = `
            <div style="margin: 0 30px 0 0; text-align: center;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #004E9D;">
                    ${storeInfo.assortment}
                </p>
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                    Assortment
                </p>
            </div>
            `;

            // Daten für Distance to Next Store
            storeInfoContainerDistanceNextStore.innerHTML = `
            <div style="margin: 0 30px 0 0; text-align: center;">
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #004E9D;">
                    ${storeInfo.competitionDistance} miles
                </p>
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                    Distance to Next Store
                </p>
            </div>
            `;
        }

        if (storeInfo) {
            // Rufe die Daten des letzten Datensatzes ab
            const lastRecordData = getLastRecordData(storeInfo);

            if (lastRecordData) {
                const customers = lastRecordData.customers || 0;
                const holidaysThisMonth = lastRecordData.holidaysThisMonth || 0;
                const promo = lastRecordData.promos || 0;


                // Daten für Customers
                storeInfoContainerCustomers.innerHTML = `
                <div style="margin: 0 30px 0 0; text-align: center;">
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #004E9D;">
                        ${customers}
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                        Expected Customers
                    </p>
                </div>
                `;

                // Daten für Holidays
                storeInfoContainerHolidays.innerHTML = `
                <div style="margin: 0 30px 0 0; text-align: center;">
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #004E9D;">
                        ${holidaysThisMonth}
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                        School or State Holidays
                    </p>
                </div>
                `;

                // Daten für Promotions
                storeInfoContainerPromotions.innerHTML = `
                <div style="margin: 0 30px 0 0; text-align: center;">
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #004E9D;">
                        ${promo}
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                        Days with Local Promotion
                    </p>
                </div>
                `;
            }
        }
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

    // // Event-Listener für die nächste Store-Schaltfläche
    // document.getElementById('nextStoreButton').addEventListener('click', nextStore);

    // // Event-Listener für die vorherige Store-Schaltfläche
    // document.getElementById('prevStoreButton').addEventListener('click', prevStore);

    // Funktion zum Aktualisieren der Schaltflächenaktivität basierend auf der Anzahl der ausgewählten Stores
    function updateButtonActivity() {
        const stores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const prevButton = document.getElementById('prevStoreButton');
        const nextButton = document.getElementById('nextStoreButton');

        // SCHALTFLÄCHEN AKTUELL DEAKTIVIERT
        if (stores.length < 99) {
            prevButton.disabled = true;
            nextButton.disabled = true;
        } else {
            prevButton.disabled = false;
            nextButton.disabled = false;
        }
    }

    // Event-Listener für den Anzeigen-Button
    document.getElementById('anzeigenButton').addEventListener('click', function () {
        vorhersageWert = 1;
        document.getElementById('vorhersageAnzeigen').textContent = vorhersageWert;
        updateChartWithSelectedStores(); // Update the charts when the button is clicked
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

        // Aktualisierungen für Store-Infos
        updateButtonActivity();
        updateSelectedStore();
    }

    // Funktion zum Aktualisieren des Graphen mit CSV-Daten
    function updateGraphWithCSVData(data, chart) {
        const labels = Object.keys(data[Object.keys(data)[0]]);
        const datasets = [];

        let minValue = Infinity;
        let maxValue = -Infinity;

        for (const store in data) {
            const values = [];
            for (const label of labels) {
                const value = data[store][label] || 0;
                values.push(value);
                if (value < minValue) minValue = value;
                if (value > maxValue) maxValue = value;
            }

            datasets.push({
                label: store,
                data: values,
                lineTension: 0,
                backgroundColor: ['#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', 'grey'],
                // borderColor: ['#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', '#004E9D', 'grey'],
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

            Chart.register(ChartDataLabels);

            // Initialisierung der Line Charts
            Chart.register(ChartDataLabels); // DataLabels Plugin registrieren

            lineChart = new Chart(lineCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sales Development | in USD', // Hier die gewünschte Überschrift einfügen
                            font: {
                                size: 16
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: false,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        },
                        tooltip: {
                            boxPadding: 3,
                            callbacks: {
                                label: function (tooltipItem) {
                                    const store = tooltipItem.dataset.label; // Store-Name vom Dataset holen
                                    const month = tooltipItem.label; // Monat aus Tooltip-Label abrufen

                                    // Zugriff auf die monatlichen Daten für "Customers" und "HolidaysThisMonth"
                                    const monthlyData = storeInfoData[store]?.monthlyData[month];
                                    const customers = monthlyData ? monthlyData.customers : 0; // Kundenanzahl für den Monat
                                    const holidaysThisMonth = monthlyData ? monthlyData.holidaysThisMonth : 0; // Feiertage für den Monat
                                    const promos = monthlyData ? monthlyData.promos : 0; // Promotionen für den Monat

                                    // Tooltip-Text zusammenstellen
                                    return [
                                        '$' + tooltipItem.formattedValue,
                                        'Customers: ' + customers,
                                        'Holidays: ' + holidaysThisMonth,
                                        'Promos: ' + promos
                                    ];
                                }
                            }
                        },
                        datalabels: {
                            anchor: 'end', // Labels am Ende des Balkens positionieren
                            align: 'top',  // Über dem Balken
                            font: {
                                size: 10
                            },
                            color: 'black', // Label-Farbe
                            formatter: function (value, context) {
                                return value.toLocaleString('en-US'); // Zeigt den Wert über jedem Balken an
                            }
                        }
                    },
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            display: false // Y-Achse komplett ausblenden
                        },
                        x: {
                            grid: {
                                display: false // Gitterlinien im Hintergrund entfernen
                            }
                        }
                    }
                }
            });



            // Media Query für kleine Bildschirme
            if (window.matchMedia('(max-width: 768px)').matches) {
                // Optionen für kleine Bildschirme anpassen
                lineChart.options.plugins.legend.display = false; // Legende ausblenden
                // Charts aktualisieren
                lineChart.update();
            }

            // Zweiten Line Chart initialisieren
            lineChart2 = new Chart(lineCtx2, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sales Development | in USD', // Hier die gewünschte Überschrift einfügen
                            font: {
                                size: 16
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: false,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        },
                        tooltip: {
                            boxPadding: 3,
                            callbacks: {
                                label: function (tooltipItem) {
                                    const store = tooltipItem.dataset.label; // Store-Name vom Dataset holen
                                    const month = tooltipItem.label; // Monat aus Tooltip-Label abrufen

                                    // Zugriff auf die monatlichen Daten für "Customers" und "HolidaysThisMonth"
                                    const monthlyData = storeInfoData[store]?.monthlyData[month];
                                    const customers = monthlyData ? monthlyData.customers : 0; // Kundenanzahl für den Monat
                                    const holidaysThisMonth = monthlyData ? monthlyData.holidaysThisMonth : 0; // Feiertage für den Monat
                                    const promos = monthlyData ? monthlyData.promos : 0; // Promotionen für den Monat

                                    // Tooltip-Text zusammenstellen
                                    return [
                                        '$' + tooltipItem.formattedValue,
                                        'Customers: ' + customers,
                                        'Holidays: ' + holidaysThisMonth,
                                        'Promos: ' + promos
                                    ];
                                }
                            }
                        },
                        datalabels: {
                            anchor: 'end', // Labels am Ende des Balkens positionieren
                            align: 'top',  // Über dem Balken
                            font: {
                                size: 10
                            },
                            color: 'black', // Label-Farbe
                            formatter: function (value, context) {
                                return value.toLocaleString('en-US'); // Zeigt den Wert über jedem Balken an
                            }
                        }

                    },
                    scales: {
                        y: {
                            display: false // Y-Achse komplett ausblenden
                        },
                        x: {
                            grid: {
                                display: false // Gitterlinien im Hintergrund entfernen
                            }
                        }
                    }
                }
            });

            // Media Query für kleine Bildschirme
            if (window.matchMedia('(max-width: 768px)').matches) {
                // Optionen für kleine Bildschirme anpassen
                lineChart2.options.plugins.legend.display = false; // Legende ausblenden
                // Charts aktualisieren
                lineChart2.update();
            }


            lineChart2.options.animation = {
                onComplete: function () {
                    const dataset = lineChart2.data.datasets[0];
                    //const lastValueIndex = dataset.data.length - 1;
                    //const lastValue = dataset.data[lastValueIndex];
                    const button = document.getElementById('questionButton');
                    //const scale = lineChart2.scales.y;
                    const meta = lineChart2.getDatasetMeta(0);
                    //const rect = meta.data[lastValueIndex].getProps(['x', 'y', 'base']);

                    // Animation für das Einfliegen des Buttons
                    button.style.transition = 'top 0.5s, left 0.5s';

                    // Position des Buttons über dem Linienwert berechnen und setzen
                    //const buttonTop = scale.getPixelForValue(lastValue); // Top-Position des Linienwertes

                    // Überprüfen der Bildschirmgröße
                    //const viewportWidth = window.innerWidth;
                    //const viewportHeight = window.innerHeight;

                    // Anpassung der Position basierend auf der Bildschirmgröße
                    //let buttonOffsetTop;

                    // Überprüfen, ob die Bildschirmbreite unter 1200 Pixel liegt
                    //if (viewportWidth < 1200) {
                    //    buttonOffsetTop = 0; // Position unverändert lassen
                    //} else {
                    //    buttonOffsetTop = 0.29 * viewportHeight;
                    //
                    //    // Neue Position des Buttons
                    //    const newTop = buttonTop - button.offsetHeight - buttonOffsetTop;

                    //    button.style.top = newTop + 'px'; // Neue Position nach Animation
                    //}
                }
            };

            // Balkendiagramm initialisieren
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['2022', '2023', '2024 (current)'],
                    datasets: [{
                        label: 'Jahresumsatz',
                        data: [132498, 130456, 29118],
                        backgroundColor: ['grey'],
                        borderColor: 'transparent',
                        borderWidth: 1,
                        barThickness: 50,
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value, index, values) {
                                    return '$' + value.toLocaleString(); // Werte als Dollar-Format anzeigen
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            boxPadding: 3,
                            callbacks: {
                                label: function (tooltipItem) {
                                    return '$' + tooltipItem.raw.toLocaleString(); // Tooltip-Werte als Dollar-Format anzeigen
                                }
                            }
                        }
                    }
                }
            });


            // Rufe die Funktion zum Aktualisieren des Graphen mit den vorausgewählten Stores auf
            updateChartWithSelectedStores();
        });

})();




// Copy vom html Dokument
var yourTarget = 8000;
var actualSales = 10300;
var basePayout = 0;
var optionCost = 0;
var questionButtonClick = "no";
var savedSliderValue = 8000;
var optionId = "noMessage";

async function btn_click() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');

    // Werte aus dem localStorage abrufen
    const uuid = localStorage.getItem("user_uuid");
    const group = localStorage.getItem("user_group");
    const startTime = localStorage.getItem("start_time");
    const prolificID = localStorage.getItem("prolificID");
    const comprehensionCheck = localStorage.getItem("comprehensionCheck");
    const initialYourTarget = localStorage.getItem("initialYourTarget");


    // Neue Werte in den localStorage speichern
    localStorage.setItem("questionButtonClick", questionButtonClick);
    localStorage.setItem("savedSliderValue", savedSliderValue);
    localStorage.setItem("yourTarget", yourTarget);
    localStorage.setItem("optionId", optionId);

    // Werte an die API senden
    try {
        const response = await fetch("https://controlling.xaidemo.de/api/clicks", { // Endpunkt hier anpassen
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: uuid, // Nur die reine UUID senden
                prolificID: prolificID,
                group: group,
                start: startTime, // Verwende den gespeicherten Startzeitpunkt
                comprehensionCheck: comprehensionCheck,
                questionButton: questionButtonClick,
                initialGuess: savedSliderValue,
                initialTarget: initialYourTarget, //hier
                finalTarget: yourTarget,
                advice: optionId,
                end: Date.now() // Das Ende ist der aktuelle Zeitpunkt
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Data successfully sent to the API:", data);

        // Weiterleitung zur nächsten Seite
        window.location.href = "https://www.soscisurvey.de/sales-development-forecast/"
            + "?id=" + encodeURIComponent(id)
            + "&YourTarget=" + encodeURIComponent(yourTarget)
            + "&actualSales=" + encodeURIComponent(actualSales)
            + "&basePayout=" + encodeURIComponent(basePayout)
            + "&optionCost=" + encodeURIComponent(optionCost)
            + "&initialYourTarget=" + encodeURIComponent(initialYourTarget);

        //window.location.href = "survey.html?id=" + encodeURIComponent(id)
        //+ "&YourTarget=" + encodeURIComponent(yourTarget)
        //+ "&actualSales=" + encodeURIComponent(actualSales)
        //+ "&basePayout=" + encodeURIComponent(basePayout)
        //+ "&optionCost=" + encodeURIComponent(optionCost);

    } catch (error) {
        console.error('Error sending data to the API:', error);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    var modal3 = document.getElementById("modal3");
    var modal4 = document.getElementById("modal4");
    var messageExampleModal = document.getElementById("messageExampleModal");
    var continueButton = document.getElementById("continueButton");
    var closeButtons = document.querySelectorAll(".close");
    var targetSlider = document.getElementById("targetSlider");
    var sliderValue = document.getElementById("sliderValue");
    var payoutAmount = document.getElementById("payoutAmount");
    var setTargetButton = document.getElementById("setTargetButton");
    var finalSetTargetButton = document.getElementById("finalSetTargetButton");
    var noMessageBtn = document.getElementById("noMessageBtn");
    var salesExpectationsBtn = document.getElementById("salesExpectationsBtn");
    var trustForecastBtn = document.getElementById("trustForecastBtn");
    var acknowledgeButton = document.getElementById("acknowledgeButton");
    var optionButtons = [noMessageBtn, salesExpectationsBtn, trustForecastBtn];
    var messageExampleText = document.getElementById("messageExampleText");
    var estimateButton = document.getElementById("estimateButton");
    var modalEstimate = document.getElementById("modalEstimate");
    var targetSlider1 = document.getElementById("targetSlider1");
    var sliderValue1 = document.getElementById("sliderValue1");
    var anzeigenButton = document.getElementById("anzeigenButton");
    var taskParagraph = document.querySelector('p.task');
    var estimateSale = document.querySelector('p.estimateSale');
    var selectedOption = 'noMessage';
    var AIestimate = document.querySelector('p.AIestimate');
    var decreaseButton = document.getElementById('decreaseButton');
    var increaseButton = document.getElementById('increaseButton');
    var decreaseButton2 = document.getElementById('decreaseButton2');
    var increaseButton2 = document.getElementById('increaseButton2');
    var taskOverview = document.getElementById('modalTask');

    function showModalTask() {
        taskOverview.style.display = "block";
    }
    window.onload = showModalTask;

    // Zeige Modal3 bei Klick auf den Continue-Button
    continueButton.onclick = function () {
        modal3.style.display = "block";
    }

    // Schließe alle Modale, wenn der Schließen-Button geklickt wird
    closeButtons.forEach(function (button) {
        button.onclick = function () {
            button.closest('.modal').style.display = "none";
        }
    });

    // Initialisiere den Slider und die Auszahlung
    var initialSliderValue = targetSlider.value;
    sliderValue.textContent = `$${initialSliderValue}`;
    updatePayout(initialSliderValue);

    // Event-Listener für Slider-Eingaben
    targetSlider.oninput = function () {
        var currentValue = this.value;
        const formattedValue = formatNumberWithCommas(currentValue);
        sliderValue.textContent = `$${formattedValue}`;
        yourTarget = currentValue; // Speichern des aktuellen Werts
        updatePayout(currentValue);
    };

    // Event-Listener für den Minus-Button
    decreaseButton2.onclick = function () {
        var currentValue = parseInt(targetSlider.value);
        if (currentValue > parseInt(targetSlider.min)) {
            targetSlider.value = currentValue - parseInt(targetSlider.step);
            const formattedValue = formatNumberWithCommas(targetSlider.value);
            currentValue = targetSlider.value; // Aktualisiere den aktuellen Wert
            sliderValue.textContent = `$${formattedValue}`;
            yourTarget = currentValue; // Speichern des aktuellen Werts
            updatePayout(currentValue);
        }
    };

    // Event-Listener für den Plus-Button
    increaseButton2.onclick = function () {
        var currentValue = parseInt(targetSlider.value);
        if (currentValue < parseInt(targetSlider.max)) {
            targetSlider.value = currentValue + parseInt(targetSlider.step);
            const formattedValue = formatNumberWithCommas(targetSlider.value);
            currentValue = targetSlider.value; // Aktualisiere den aktuellen Wert
            sliderValue.textContent = `$${formattedValue}`;
            yourTarget = currentValue; // Speichern des aktuellen Werts
            updatePayout(currentValue);
        }
    };

    // Funktion zur Berechnung und Anzeige der Auszahlung
    function updatePayout(value) {
        basePayout = calculatePayout(value); // Berechne und aktualisiere die globale Basis-Auszahlung
        var payout = basePayout - optionCost; // Ziehe die Kosten für die ausgewählte Option ab
        if (optionCost > 0) {
            payoutAmount.innerHTML = `
                <div class="calculation">
                <p class="value">£${basePayout.toFixed(2)} - <span style="color: red;">£${optionCost.toFixed(2)}</span> = £${Math.max(payout, 0).toFixed(2)}</p>
                </div>
            `;
        } else {
            payoutAmount.innerHTML = `
                <div class="calculation">
                <p class="value">£${basePayout.toFixed(2)}</p>
                </div>
            `;
        }
    }

    // Berechnung der Auszahlung
    function calculatePayout(value) {
        var bonusPerUnit = 0.20 / 1000; // 0,20 USD für 1000 Sales
        return (value * bonusPerUnit) - 1.20;
    }

    // Funktion zum Anzeigen von Modal4
    function showModal4() {
        modal4.style.display = "block";
    }

    // Funktion zum Anzeigen des Nachrichtensbeispiel-Modals
    function showMessageExample(text) {
        var text = `
            <p>Hello,</p>
            <p>I appreciate your message and I can see you have already made an educated guess on your sales targets.</p>
            <p>I feel like the AI is very accurate with its prediction and I don‘t think you can expect sales to exceed $10,300 for the month of April.</p>
            <p>Kind Regards,</p>
            <p>Supervisor</p>
        `;
        messageExampleText.innerHTML = text; // Setze HTML-Inhalt
        messageExampleModal.style.display = "block";
    }

    setTargetButton.onclick = function () {
        // Hole den aktuellen Wert des Sliders (falls er noch nicht aktualisiert wurde)
        yourTarget = targetSlider.value;

        // Ursprünglichen Wert von yourTarget zwischenspeichern, falls noch nicht geschehen
        localStorage.setItem("initialYourTarget", yourTarget);


        // Zeige Modal4 an
        showModal4();
    };


    // Funktion zur Auswahl einer Option im Modal4
    function selectOption(optionId) {
        selectedOption = optionId;
        optionButtons.forEach(function (btn) {
            btn.classList.remove('active');
        });
        document.getElementById(optionId + 'Btn').classList.add('active');
        optionCost = calculateOptionCost(selectedOption); // Berechne und aktualisiere die globale Option-Kosten
        updatePayout(targetSlider.value); // Aktualisiere die Auszahlung nach Auswahl der Option
    }

    function showHintInModal3(text) {
        var modal3 = document.getElementById('modal3');
        var hintElement = modal3.querySelector('.hint');
        if (hintElement) {
            hintElement.textContent = text;
        }
    }

    // Event-Listener für die Auswahloptionen im Modal4
    optionButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var selectedOptionId = this.id.replace('Btn', '');
            var exampleText = "";
            var hintText = "";

            if (selectedOptionId === 'noMessage') {
                modal4.style.display = "none";
                optionCost = 0.00; // Keine Kosten
                hintText = "You can now adjust your target level one last time. ";
            } else {
                if (selectedOptionId === 'salesExpectations') {
                    exampleText = "What are your sales expectations from our store?";
                    hintText = "After asking your supervisor you can now adjust your target level one last time.";
                } else if (selectedOptionId === 'trustForecast') {
                    exampleText = "Do you think I should trust the forecast?";
                    hintText = "After asking your supervisor you can now adjust your target level one last time.";
                }
                modal4.style.display = "none";
                showMessageExample(exampleText);
                optionCost = 0.30; // Abzug der Kosten für die ausgewählte Option
                // Aktualisiere die globale optionId
                optionId = selectedOptionId;
            }

            // Zeige den Hinweistext in Modal3
            showHintInModal3(hintText);

            // Blende den Set Target Button aus und zeige den Final Set Target Button an
            setTargetButton.style.display = "none";
            finalSetTargetButton.style.display = "block";

            updatePayout(targetSlider.value); // Aktualisiere die Auszahlung
        });
    });

    function calculateOptionCost(option) {
        if (option === 'noMessage') {
            return 0.00;
        } else if (option === 'salesExpectations' || option === 'trustForecast') {
            return 0.30;
        }
        return 0.00;
    }

    // Event-Listener für den Final Set Target Button
    finalSetTargetButton.onclick = function () {
        // Blende den Final Set Target Button aus
        finalSetTargetButton.style.display = "none";
        // Mache den Continue-Button nicht mehr klickbar
        continueButton.style.pointerEvents = "none";
        continueButton.style.opacity = "0.5";
        //target slider deaktivieren
        document.getElementById('targetSlider').disabled = true;
        // Deaktiviert die Buttons
        document.getElementById('decreaseButton2').disabled = true;
        document.getElementById('increaseButton2').disabled = true;

        // Zeige die Redirect Message
        const redirectMessage = document.getElementById('redirectMessage');
        let countdown = 5;
        redirectMessage.style.display = 'block';
        redirectMessage.textContent = `Your sales target has been saved. You will be redirected to the survey in ${countdown} seconds.`;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                redirectMessage.textContent = `Your sales target has been saved. You will be redirected to the survey in ${countdown} seconds.`;
            } else {
                clearInterval(countdownInterval);
                // Hier wird die btn_click Funktion nach Ablauf des Countdowns aufgerufen
                btn_click();
            }
        }, 1000); // Update every second
    };

    // Event-Listener für den "Alright, thanks!" Button
    acknowledgeButton.onclick = function () {
        // Schließe das Nachrichtensbeispiel-Modal
        messageExampleModal.style.display = "none";
        // Berechne und aktualisiere die Auszahlung
        var currentValue = targetSlider.value;
        updatePayout(currentValue);
        // Zeige Modal3 wieder an
        modal3.style.display = "block";
    };

    // Berechnung der Kosten für die Auswahloptionen
    function calculateOptionCost(option) {
        switch (option) {
            case 'salesExpectations':
            case 'trustForecast':
                return 0.30;
            default:
                return 0.00;
        }
    }

    // Zeige ModalEstimate bei Klick auf den Estimate-Button
    estimateButton.onclick = function () {
        modalEstimate.style.display = "block";
    }

    // Initialisiere den Slider und die Auszahlung
    var initialSliderValue1 = targetSlider1.value;
    sliderValue1.textContent = `$${initialSliderValue1}`;

    // Event-Listener für den Minus-Button
    decreaseButton.onclick = function () {
        var currentValue1 = parseInt(targetSlider1.value);
        if (currentValue1 > parseInt(targetSlider1.min)) {
            targetSlider1.value = currentValue1 - parseInt(targetSlider1.step);
            const formattedValue = formatNumberWithCommas(targetSlider1.value);
            sliderValue1.textContent = `$${formattedValue}`;
            savedSliderValue = targetSlider1.value;
        }
    };

    // Event-Listener für den Plus-Button
    increaseButton.onclick = function () {
        var currentValue1 = parseInt(targetSlider1.value);
        if (currentValue1 < parseInt(targetSlider1.max)) {
            targetSlider1.value = currentValue1 + parseInt(targetSlider1.step);
            const formattedValue = formatNumberWithCommas(targetSlider1.value);
            sliderValue1.textContent = `$${formattedValue}`;
            savedSliderValue = targetSlider1.value;
        }
    };

    // Event-Listener für Slider-Eingaben
    targetSlider1.oninput = function () {
        var currentValue1 = this.value;
        const formattedValue = formatNumberWithCommas(currentValue1);
        sliderValue1.textContent = `$${formattedValue}`;
        savedSliderValue = currentValue1; // Speichern des aktuellen Werts
    };

    anzeigenButton.onclick = function () {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('id');
        const ForecastDiv = document.getElementById("TextAIForecast");


        modalEstimate.style.display = "none";
        continueButton.style.display = "block";
        estimateButton.style.display = "none";



        // Bedingung für Gruppe NX
        if (id && id.startsWith("NX")) {
            taskParagraph.innerHTML = ''; // Leer
            ForecastDiv.innerHTML = `
                    <div class="row h-25" style="height: calc(25% - 10px); margin-bottom: 5px;">
                        <div class="col d-flex flex-column align-items-center justify-content-center content-box7">
                            <p style="margin: 0; font-size: 16px; font-weight: bold; color: black;">
                                $10,200
                            </p>
                            <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                                AI-Forecast
                            </p>
                        </div>
                    </div>
                    `;
        } else {
            // Text hinzufügen, wenn nicht in Gruppe NX
            ForecastDiv.innerHTML = `
                    <div class="row h-25" style="height: calc(25% - 10px); margin-bottom: 5px;">
                        <div class="col d-flex flex-column align-items-center justify-content-center content-box7">
                            <p style="margin: 0; font-size: 16px; font-weight: bold; color: black;">
                                $10,200
                            </p>
                            <p style="margin: 0; font-size: 14px; font-weight: bold; color: black;">
                                AI-Forecast
                            </p>
                        </div>
                    </div>
                    <div class="row h-50" style="height: calc(50% - 10px); margin-top: 5px;">
                        <div class="col d-flex content-box2" >
                            <p class="task"><span style="font-size: 1.2rem;"></span>
                                Let the AI explain how it calculates the forecast by clicking on <span class="question-mark">?</span> in the forecast.
                            </p>
                        </div>
                    </div>
                    `;

        }

        

        determineAndOpenModal();
    }

    const modal = document.getElementById("modal");
    const modal2 = document.getElementById("modal2");
    const modalNX = document.getElementById("modalNX");
    const questionButton = document.getElementById("questionButton");
    const mehrButton = document.getElementById("mehrButton");

    // Funktion zum Laden von JSON-Daten
    async function loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Netzwerkantwort war nicht ok.");
        }
        return await response.json();
    }

    // Funktion zum Öffnen des Modals NX
    async function openModalNX() {
        try {
            // Stelle sicher, dass der Modal-Container vorhanden ist
            const modalNXContent = document.getElementById("modalNXContent");
            if (!modalNXContent) {
                console.error("Das Element 'modalNXContent' wurde nicht gefunden.");
                return;
            }

            // Berechne die benutzerdefinierte Schieberegler-Wertformatierung
            const formattedSavedSliderValue = formatNumberWithCommas(savedSliderValue);

            // HTML-Inhalt des Modals anpassen
            modalNXContent.innerHTML = `
            <p>The AI estimates <strong>$10,200</strong> instead of <strong>$${formattedSavedSliderValue}</strong> (your estimation).</p>
        `;

            // Modal anzeigen
            const modalNX = document.getElementById("modalNX");
            if (!modalNX) {
                console.error("Das Modal-Element wurde nicht gefunden.");
                return;
            }
            modalNX.style.display = "block";

        } catch (error) {
            console.error("Fehler beim Öffnen des Modals NX:", error);
        }
    }

    // Funktion zum Öffnen des ersten Modals und Laden der JSON-Daten
    async function openModal1() {
        try {
            // Stelle sicher, dass der Modal-Container vorhanden ist
            const modal1Content = document.getElementById("modal1Content");
            if (!modal1Content) {
                console.error("Das Element 'modal1Content' wurde nicht gefunden.");
                return;
            }

            // Lade die JSON-Daten
            const response = await fetch("/shap_feature_importance.json");
            if (!response.ok) {
                throw new Error(`Fehler beim Laden der JSON-Daten: ${response.statusText}`);
            }
            const data = await response.json();

            // Generiere den HTML-Code für die Progress Bars
            const firstTwoItems = data.slice(0, 3);
            const progressBarsHTML = firstTwoItems.map(item => {
                const percentage = Math.min(100, item.percentage_importance); // Falls die Werte größer als 100 sind, auf 100 begrenzen
                return `
                <div class="progress-container" style="margin-bottom: 15px;">
                    <p><strong>${item.col_name}</strong></p>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" style="width: ${percentage}%;"></div>
                    </div>
                </div>
            `;
            }).join('');

            // Berechne die geschätzten und benutzerdefinierten Werte
            const formattedSavedSliderValue = formatNumberWithCommas(savedSliderValue);

            // HTML-Inhalt des Modals anpassen
            modal1Content.innerHTML = `
            <p>The AI estimates <strong>$10,200</strong> instead of <strong>$${formattedSavedSliderValue}</strong> (your estimation).</p>
            <p>Here you can see which factors had the biggest influence on the AI forecast:</p>
            ${progressBarsHTML}
        `;

            // Modal anzeigen
            const modal = document.getElementById("modal");
            if (!modal) {
                console.error("Das Modal-Element wurde nicht gefunden.");
                return;
            }
            modal.style.display = "block";

        } catch (error) {
            console.error("Fehler:", error);
        }
    }



    async function openModal2() {
        try {
            // Lade die JSON-Daten
            const data = await loadJSON("/cf_470.json");

            // Finde die Datenreihe mit dem `Sales_CF`, der dem Benutzerwert am nächsten ist
            let closestData = null;
            let closestDifference = Infinity;

            data.forEach(item => {
                const difference = Math.abs(item.Sales_CF - savedSliderValue);
                if (difference < closestDifference) {
                    closestDifference = difference;
                    closestData = item;
                }
            });

            // Prüfe, ob wir eine passende Datenreihe gefunden haben
            if (closestData) {
                const modal2Content = document.getElementById("modal2Content");

                // Extrahiere die Issues
                const issues = closestData.Explanation.Issues;

                // Formatiere die Issues als HTML-Liste
                const issuesList = issues.map(issue => `<li>${issue}</li>`).join('');

                const formattedClosestDataSales = formatNumberWithCommas(Math.round(closestData.Sales));
                const formattedSavedSliderValue = formatNumberWithCommas(savedSliderValue);

                modal2Content.innerHTML = `
                      <p>The AI estimates <strong>$${formattedClosestDataSales}</strong> instead of <strong>$${formattedSavedSliderValue}</strong> (your estimation) for the following reasons:</p>
                      <ul style="color: #555;">
                          ${issuesList}
                      </ul>
                  `;
                modal2.style.display = "block";
            } else {
                console.error("Keine passende Datenreihe gefunden.");
            }
        } catch (error) {
            console.error("Fehler beim Laden der JSON-Daten:", error);
        }
    }

    // Funktion zum Bestimmen, welches Modal geöffnet werden soll
    function determineAndOpenModal() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('id');

        // Überprüfe, ob eine ID vorhanden ist und ob sie gültig ist
        if (id.startsWith("NX")) {
            questionButton.style.display = 'none';
            openModalNX();
            return;
        }

        if (id.startsWith("FI")) {
            openModal1();
        } else if (id.startsWith("CF")) {
            openModal2();
        } else {
            console.error("Ungültige ID in der URL. Öffne Modal 1.");
            openModal2();
        }
    }

    // Event Listener für den "Mehr"-Button im ersten Modal
    mehrButton.addEventListener("click", function (event) {
        event.preventDefault();
        modal.style.display = "none";
        openModal2();
    });

    // Event Listener für den "questionButton"
    questionButton.addEventListener("click", async function () {
        determineAndOpenModal();
        //questionButton.style.display = "none";
        questionButtonClick = "yes";
    });

    // Funktion zum Mischen eines Arrays
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Das parent Element für die Buttons
    const messageOptions = document.getElementById('messageOptions');

    // Die Buttons sammeln und in ein Array konvertieren
    const buttons = Array.from(messageOptions.getElementsByTagName('button'));

    // Die Reihenfolge der Buttons randomisieren
    const shuffledButtons = shuffle(buttons);

    // Die alten Buttons entfernen
    messageOptions.innerHTML = '';

    // Die neu sortierten Buttons hinzufügen und den Text anpassen
    shuffledButtons.forEach((button, index) => {
        // Ändere den Text je nach Index
        if (index === 0) {
            button.textContent = "Message Option 1: " + button.textContent; // Erster Button
            localStorage.setItem('firstMessageOption', button.innerText)
        } else if (index === 1) {
            button.textContent = "Message Option 2: " + button.textContent; // Zweiter Button
        }
        messageOptions.appendChild(button);
    });

    // Funktion, um eine Zahl mit Tausendertrennzeichen zu formatieren
    function formatNumberWithCommas(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }


});