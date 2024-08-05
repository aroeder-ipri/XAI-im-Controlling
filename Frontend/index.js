// Funktionen zum Abrufen und Speichern des Zählers in localStorage
function getStoredCounter() {
    let storedCounter = localStorage.getItem('counter');
    return storedCounter ? parseInt(storedCounter, 10) : 0;
}

function setStoredCounter(value) {
    localStorage.setItem('counter', value);
}

function assignGroup() {
    let counter = getStoredCounter();
    counter++;
    setStoredCounter(counter);
    return counter % 2 === 0 ? 'CF' : 'FI';
}

// Teste die Funktion
console.log(assignGroup()); // "FI" oder "CF", je nach dem aktuellen Wert von localStorage
console.log(assignGroup()); // "FI" oder "CF"
console.log(assignGroup()); // "FI" oder "CF"
console.log(assignGroup()); // "FI" oder "CF"

async function id_api_call() {
    const apiUrl = 'https://controlling.xaidemo.de/api/id'; // Sicherstellen, dass diese URL korrekt ist
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const user = await response.json();
        return user.id;
    } catch (error) {
        console.error('Error in id_api_call:', error);
        throw error;
    }
}

async function btn_click() {
    let group = assignGroup(); // Benutzer in eine Gruppe einteilen
    try {
        let id = await id_api_call();
        id = `${group}-${id}`; // ID mit Gruppenvorsilbe versehen
        console.log(id);
        send_feedback(id, group);
        window.location.href = "setting.html?id=" + id;
    } catch (error) {
        console.error('Error in btn_click:', error);
    }
}

async function send_feedback(id, group) {
    let btn_click_time = Date.now();
    try {
        const rawResponse = await fetch("https://controlling.xaidemo.de/api/clicks", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: id,
                group: group, // Die Gruppenzuordnung hinzufügen
                //timestamp: btn_click_time,
                //click_time: click_event.click_time
            })
        });
        const content = await rawResponse.json();
        //console.log(content)
    } catch (error) {
        console.error("Error sending feedback:", error);
    }
}
