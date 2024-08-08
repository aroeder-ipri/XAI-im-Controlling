// Funktion zur zufälligen Zuweisung der Gruppe
function assignGroup() {
    const groups = ['CF', 'FI'];
    const randomIndex = Math.floor(Math.random() * groups.length);
    return groups[randomIndex];
}

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
    let rawResponse; // rawResponse außerhalb des try-Blocks definieren

    try {
        rawResponse = await fetch("https://controlling.xaidemo.de/api/clicks", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: id,
                group: group,
                timestamp: btn_click_time,
            })
        });

        if (!rawResponse.ok) {
            throw new Error(`HTTP error! Status: ${rawResponse.status}`);
        }

        const content = await rawResponse.json();
        console.log(content);
    } catch (error) {
        console.error("Error sending feedback:", error);

        // Zusätzliche Fehlerdetails anzeigen, falls rawResponse existiert
        if (rawResponse) {
            console.error("Response status:", rawResponse.status);
            const responseText = await rawResponse.text();
            console.error("Response text:", responseText);
        } else {
            console.error("No response received");
        }

        // Überprüfe auf spezifische CORS-Fehler
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error("This might be a CORS issue or a network problem.");
        }
    }
}

// Aufruf der Funktion zum Testen
send_feedback('test-id', 'test-group');
