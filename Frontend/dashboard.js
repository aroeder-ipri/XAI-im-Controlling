/* globals Chart:false **/

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
            holidaysThisMonth: holidaysThisMonth
        };
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
if (storeInfo) {
    const storeInfoDiv = document.createElement('div');

 // Stile für das Container-Div hinzufügen
 storeInfoDiv.style.display = 'flex';
 storeInfoDiv.style.alignItems = 'flex-start'; // Anpassung für vertikale Ausrichtung oben
 storeInfoDiv.style.gap = '50px'; // Abstand zwischen den Gruppen
 storeInfoDiv.style.maxWidth = '100%'; // Maximale Breite setzen
 storeInfoDiv.style.overflow = 'hidden'; // Verhindert das Überlaufen des Inhalts

    // Stile für das Container-Div hinzufügen
    storeInfoDiv.style.display = 'flex';
    storeInfoDiv.style.flexDirection = 'column'; // Inhalte untereinander anordnen
    storeInfoDiv.style.gap = '20px'; // Abstand zwischen den Gruppen
    storeInfoDiv.style.maxWidth = '100%'; // Maximale Breite setzen

    storeInfoDiv.innerHTML = `
    <div style="overflow-wrap: break-word; max-width: 100%;">
        <div style="margin-bottom: 20px;">
            <p><strong>Store Location:</strong></p>
            <p>${currentStoreElement.textContent}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <p><strong>Store Type:</strong></p>
            <p>${storeInfo.storeType}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <p><strong>Assortment:</strong></p>
            <p> ${storeInfo.assortment}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <p><strong>Distance to next store:</strong></p>
            <p>${storeInfo.competitionDistance} miles</p>
        </div>
        <div>
            <p><strong>Days with promotions in the last month:</strong></p>
            <p>${storeInfo.promo} days</p>
        </div>
    </div>
`;





        storeInfoContainer.appendChild(storeInfoDiv);
    } else {
        storeInfoContainer.textContent = 'Store-Informationen nicht verfügbar';
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


// Event-Listener für die nächste Store-Schaltfläche
document.getElementById('nextStoreButton').addEventListener('click', nextStore);

// Event-Listener für die vorherige Store-Schaltfläche
document.getElementById('prevStoreButton').addEventListener('click', prevStore);

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
            backgroundColor: 'transparent',
            borderColor: ['grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'grey', 'red'],
            borderWidth: 2,
            pointBackgroundColor: '#ffffff'
        });
    }

    chart.data.labels = labels;
    chart.data.datasets = datasets;

    chart.options.scales.y.min = Math.floor((minValue - 1000) / 100) * 100;
    chart.options.scales.y.max = Math.ceil((maxValue + 1000) / 100) * 100;

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

// Initialisierung der Line Charts
lineChart = new Chart(lineCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        plugins: {
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
                    label: function(tooltipItem) {
                        const store = tooltipItem.dataset.label; // Store-Name vom Dataset holen
                        const month = tooltipItem.label; // Monat aus Tooltip-Label abrufen
            
                        // Zugriff auf die monatlichen Daten für "Customers" und "HolidaysThisMonth"
                        const monthlyData = storeInfoData[store]?.monthlyData[month];
                        const customers = monthlyData ? monthlyData.customers : 0; // Kundenanzahl für den Monat
                        const holidaysThisMonth = monthlyData ? monthlyData.holidaysThisMonth : 0; // Feiertage für den Monat
            
                        // Tooltip-Text zusammenstellen
                        return [
                            '$' + tooltipItem.formattedValue,
                            'Customers: ' + customers,
                            'Holidays: ' + holidaysThisMonth
                        ];
                    }
                }
            }
            
            
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 0,
                max: 0,
                ticks: {
                    callback: function(value, index, values) {
                        return '$' + Math.round(value); // Rundet die Werte auf der Y-Achse
                    }
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
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        plugins: {
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
                    label: function(tooltipItem) {
                        const store = tooltipItem.dataset.label; // Store-Name vom Dataset holen
                        const month = tooltipItem.label; // Monat aus Tooltip-Label abrufen
            
                        // Zugriff auf die monatlichen Daten für "Customers" und "HolidaysThisMonth"
                        const monthlyData = storeInfoData[store]?.monthlyData[month];
                        const customers = monthlyData ? monthlyData.customers : 0; // Kundenanzahl für den Monat
                        const holidaysThisMonth = monthlyData ? monthlyData.holidaysThisMonth : 0; // Feiertage für den Monat
            
                        // Tooltip-Text zusammenstellen
                        return [
                            '$' + tooltipItem.formattedValue,
                            'Customers: ' + customers,
                            'Holidays: ' + holidaysThisMonth
                        ];
                    }
                }
            }
            
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 0,
                max: 0,
                ticks: {
                    callback: function(value, index, values) {
                        return '$' + Math.round(value); // Rundet die Werte auf der Y-Achse
                    }
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
    onComplete: function() {
        const dataset = lineChart2.data.datasets[0];
        const lastValueIndex = dataset.data.length - 1;
        const lastValue = dataset.data[lastValueIndex];
        const button = document.getElementById('questionButton');
        const scale = lineChart2.scales.y;
        const meta = lineChart2.getDatasetMeta(0);
        const rect = meta.data[lastValueIndex].getProps(['x', 'y', 'base']);

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

            // Funktion zum Anzeigen des benutzerdefinierten Modalfensters mit Informationen
// function showModalWithInfo(infoText) {
//     const modal = document.getElementById('modal');
//     const modalText = document.getElementById('modal-text');
//     modalText.textContent = infoText;
//     modal.style.display = 'block';
// }

// Funktion zum Schließen des Modalfensters
// function closeModal() {
//     document.getElementById('modal').style.display = 'none';
// }

// Eventlistener für den Close-Button im Modalfenster
// const closeBtn = document.querySelector('#modal .close');
// closeBtn.addEventListener('click', closeModal);

// Event-Listener für die Schaltfläche, um das Modalfenster zu öffnen
// document.getElementById('questionButton').addEventListener('click', function() {
//     const modal = document.getElementById('modal');
//     modal.style.display = 'block';
//     showModalWithInfo();
// });

// Funktion zum Öffnen des zweiten Modalfensters
// document.getElementById('mehrButton').addEventListener('click', function() {
//     document.getElementById('modal2').style.display = 'block';
// });

// Funktion zum Leeren des Eingabefelds
// function clearInputField() {
//     document.getElementById('zahlInput').value = ''; // Setzen des Wertes auf leer
// }

// Funktion zum Entfernen des zusätzlichen Texts
// function removeAdditionalText() {
//     const additionalText = document.getElementById('additionalText');
//     if (additionalText) {
//         additionalText.remove(); // Entfernen des zusätzlichen Texts, falls vorhanden
//     }
// }

// Funktion zum Schließen des zweiten Modalfensters
// function closeModal2() {
//     document.getElementById('modal2').style.display = 'none';
//     clearInputField(); // Aufruf der Funktion zum Leeren des Eingabefelds
//     removeAdditionalText(); // Aufruf der Funktion zum Entfernen des zusätzlichen Texts
// }

// Eventlistener für den zweiten Close-Button im zweiten Modalfenster
// const closeBtn2 = document.querySelector('#modal2 .close');
// closeBtn2.addEventListener('click', closeModal2);

// Funktion zum Erstellen der Tabs basierend auf den ausgewählten Stores
// function createTabs(selectedStores) {
//     const tabContainer = document.getElementById('myTab');
//     const tabContentContainer = document.getElementById('myTabContent');
//     const questionButton = document.getElementById('questionButton');
//     tabContainer.innerHTML = '';
//     tabContentContainer.innerHTML = '';

//     selectedStores.forEach(store => {
//         // Tab-Link erstellen
//         const tabLink = document.createElement('button');
//         tabLink.classList.add('nav-link');
//         tabLink.setAttribute('id', `${store}-tab`);
//         tabLink.setAttribute('data-bs-toggle', 'tab');
//         tabLink.setAttribute('data-bs-target', `#${store}`);
//         tabLink.setAttribute('type', 'button');
//         tabLink.setAttribute('role', 'tab');
//         tabLink.setAttribute('aria-controls', store);
//         tabLink.setAttribute('aria-selected', 'false');
//         tabLink.textContent = store;

//         // Tab-Inhalt erstellen
//         const tabContent = document.createElement('div');
//         tabContent.classList.add('tab-pane', 'fade');
//         tabContent.setAttribute('id', store);
//         tabContent.setAttribute('role', 'tabpanel');
//         tabContent.setAttribute('aria-labelledby', `${store}-tab`);
//         tabContent.innerHTML = `
//             <p id="modal-text">
//             <p></p>
//                 <p>Following you can see which factors had the biggest influence on the sales forecast:</p>
//                 <p></p>
//                 <div class="progress" style="margin-bottom: 15px;">
//                     <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
//                 </div>
//                 <div class="progress">
//                     <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
//                 </div>
//                 <div class="data-container"></div>
//             </p>
//         `;

//         // Tab-Link und Tab-Inhalt dem Container hinzufügen
//         tabContainer.appendChild(tabLink);
//         tabContentContainer.appendChild(tabContent);
//     });

//     // Event-Listener für den questionButton, um Daten zu laden
//     questionButton.addEventListener('click', function() {
//         const activeTabId = tabContainer.querySelector('.active').getAttribute('aria-controls');
//         const tabContent = document.querySelector(`#${activeTabId}`);
//         fetch('http://127.0.0.1:8000/feature_importance/')
//             .then(function(response) {
//                 if (!response.ok) {
//                     throw new Error('Netzwerkantwort war nicht ok');
//                 }
//                 return response.json();
//             })
//             .then(function(data) {
//                 const progressContainers = tabContent.querySelectorAll('.progress');
//                 const dataContainer = tabContent.querySelector('.data-container');

//                 dataContainer.innerHTML = '';
//                 progressContainers.forEach(container => {
//                     const label = container.previousElementSibling;
//                     if (label && label.tagName === "P") {
//                         label.remove();
//                     }
//                 });

//                 // Beschränke die Verarbeitung auf die ersten zwei Einträge der API-Antwort
//                 const itemsToProcess = data.slice(0, 2);
//                 itemsToProcess.forEach((item, index) => {
//                     if (progressContainers[index]) {
//                         // Erstelle und füge neue Beschriftung hinzu
//                         const progressLabel = document.createElement('p');
//                         progressLabel.textContent = "- " + item.col_name;
//                         progressContainers[index].parentNode.insertBefore(progressLabel, progressContainers[index]);

//                         // Aktualisiere Progress Bar
//                         const progressBar = progressContainers[index].querySelector('.progress-bar');
//                         const value = item.percentage_importance;
//                         progressBar.setAttribute('aria-valuenow', value);
//                         progressBar.style.width = `${value}%`;
//                         progressBar.textContent = `${value}%`;
//                     }
//                 });

//             })
//             .catch(function(error) {
//                 console.error('Fehler beim Abrufen der Daten:', error);
//                 dataContainer.innerHTML = `<p>Fehler beim Laden der Daten</p>`;
//             });
        
//     });

//     questionButton.addEventListener('click', function() {
//         var modalContent = document.querySelector('#modal2 .modal-content');

//         // Funktion zum Entfernen alter Paragraphen
//         function removeOldParagraphs() {
//             // Entferne alle alten Paragraphen
//             var paragraphs = modalContent.querySelectorAll('p');
//             paragraphs.forEach(paragraph => {
//                 paragraph.remove();
//             });
//         }

//         // Lade die Daten von der API
//         fetch('http://127.0.0.1:8000/counterfactual_explanations/')
//             .then(response => response.json())
//             .then(data => {
//                 removeOldParagraphs(); // Entferne alte Paragraphen

//                 // Variablen zum Speichern der API-Daten
//                 let salesActual, salesCounterfactual, changes, formattedChanges;

//                 data.forEach(item => {
//                     var paragraph = document.createElement('p');

//                     salesActual = item.sales_actual;
//                     salesCounterfactual = item.sales_counterfactual;
//                     changes = item.changes;
//                     // Formatiere Absätze
//                     formattedChanges = changes.map(change => `- ${change}`).join('<br>');

//                     paragraph.innerHTML = `Sales are estimated at ${salesActual}€.<br>
//                     <br>Enter your expected sales:`;
//                     modalContent.appendChild(paragraph);
//                 });

//                 // Überprüfen, ob das Eingabefeld und der Button bereits existieren
//                 if (!document.getElementById('inputDiv')) {
//                     // Erstelle das Eingabefeld und den Bestätigen-Button dynamisch
//                     var inputDiv = document.createElement('div');
//                     inputDiv.id = 'inputDiv';
//                     inputDiv.style.display = 'flex';
//                     inputDiv.style.alignItems = 'center';
//                     inputDiv.style.marginTop = '1px'; // optional, um Abstand zu den Textabsätzen zu schaffen

//                     var inputField = document.createElement('input');
//                     inputField.type = 'text';
//                     inputField.id = 'zahlInput';
//                     inputField.style.marginBottom = '10px';
//                     inputField.style.marginRight = '5px';

//                     var spanElement = document.createElement('span');
//                     spanElement.textContent = '€';

//                     var confirmButton = document.createElement('button');
//                     confirmButton.id = 'bestaetigenButton';
//                     confirmButton.className = 'btn custom-btn';
//                     confirmButton.style.marginLeft = '10px';
//                     confirmButton.disabled = true; // initial disabled
//                     confirmButton.textContent = 'confirm';

//                     inputDiv.appendChild(inputField);
//                     inputDiv.appendChild(spanElement);
//                     inputDiv.appendChild(confirmButton);

//                     modalContent.appendChild(inputDiv);

//                     // Füge Event-Listener für das Eingabefeld und den Bestätigen-Button hinzu
//                     confirmButton.addEventListener('click', function() {
//                         // Überprüfung, ob der zusätzliche Text bereits vorhanden ist
//                         if (!document.getElementById('additionalText')) {
//                             // Erstellen eines neuen Absatz-Elements für den zusätzlichen Text
//                             const additionalText = document.createElement('p');
//                             additionalText.id = 'additionalText'; // Setzen einer ID für das zusätzliche Text-Element
//                             additionalText.innerHTML = `<br>Sales are not within the given range for the following reasons:<br>${formattedChanges}`;
                            
//                             // Einfügen des zusätzlichen Texts am Ende des Modalfensters 2
//                             modalContent.appendChild(additionalText);
//                         }
//                     });

//                     // Überprüfung der Eingabe und Aktivierung des Buttons
//                     inputField.addEventListener('input', function() {
//                         var eingabeWert = this.value.trim(); // Trimmen von Leerzeichen
//                         var button = document.getElementById('bestaetigenButton');
//                         if (eingabeWert && !isNaN(eingabeWert)) { // Überprüfung auf nicht leer und numerisch
//                             button.disabled = false;
//                         } else {
//                             button.disabled = true;
//                         }
//                     });
//                 } else {
//                     // Stelle sicher, dass das Eingabefeld und der Button immer am Ende bleiben
//                     modalContent.appendChild(document.getElementById('inputDiv'));
//                 }
//             })
//             .catch(error => {
//                 console.error('Fehler beim Abrufen der Daten:', error);
//             });
//     });

//     // Den ersten Tab als aktiv markieren
//     const firstTab = tabContainer.firstElementChild;
//     const firstTabContent = tabContentContainer.firstElementChild;
//     firstTab.classList.add('active');
//     firstTab.setAttribute('aria-selected', 'true');
//     firstTabContent.classList.add('show', 'active');
// }

// Funktion zum Aktualisieren der Tabs basierend auf den ausgewählten Stores
// function updateTabs() {
//     const selectedStores = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
//     createTabs(selectedStores);
// }

// Event-Listener für Änderungen in den Checkboxen
// document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
//     checkbox.addEventListener('change', updateTabs);
// });

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
                    callback: function(value, index, values) {
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
                    label: function(tooltipItem) {
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
