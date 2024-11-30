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

// Funktion zum Speichern des Startzeitpunkts im Local Storage
function saveStartTime() {
    if (!localStorage.getItem("start_time")) {
        const startTime = Date.now();
        localStorage.setItem("start_time", startTime);
        return startTime;
    } else {
        return localStorage.getItem("start_time");
    }
}

async function btn_click() {
    let group = assignGroup(); // Benutzer in eine Gruppe einteilen
    try {
        let uuid = await id_api_call(); // Hol dir die reine UUID
        let id = `${group}-${uuid}`; // Kombiniere die UUID mit dem Gruppenvorsatz für andere Zwecke

        // Speichere die UUID und Gruppe in localStorage
        localStorage.setItem("user_uuid", uuid);
        localStorage.setItem("user_group", group);
        
        // Speichere den Startzeitpunkt im Local Storage
        const startTime = saveStartTime();

        // Feedback senden mit dem Startzeitpunkt aus dem Local Storage
        send_feedback(uuid, group, startTime); // Nur die reine UUID an die API senden
        window.location.href = "index2.html?id=" + id; // Präfix weiterhin für die URL verwenden
    } catch (error) {
        console.error('Error in btn_click:', error);
    }
}



async function send_feedback(uuid, group, startTime) {
    try {
        const rawResponse = await fetch("https://controlling.xaidemo.de/api/clicks", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: uuid,
                prolificID: "n.n.",
                group: group,
                start: startTime,
                comprehensionCheck: "n.n.",
                questionButton: "n.n.",
                initialGuess: "n.n.",
                initialTarget: "n.n.",
                finalTarget: "n.n.",
                advice: "n.n.",
                completionCodeGenerated: "n.n.",
                end: Date.now()
            })
        });

        if (!rawResponse.ok) {
            const errorDetails = await rawResponse.json();
            console.error(`HTTP error! Status: ${rawResponse.status}`);
            console.error("Error details:", errorDetails.detail); // Hier den 'detail' Teil ausgeben
            throw new Error(`HTTP error! Status: ${rawResponse.status}`);
        }

        await rawResponse.json(); // Verarbeite die Antwort nur, wenn sie erfolgreich war
    } catch (error) {
        console.error("Error sending feedback:", error);
    }
    console.log('Sending data:', {
        user_id: uuid,
        prolificID: "n.n.",
        group: group,
        start: startTime,
        comprehensionCheck: "n.n.",
        questionButton: "n.n.",
        initialGuess: "n.n.",
        initialTarget: "n.n.",
        finalTarget: "n.n.",
        advice: "n.n.",
        completionCodeGenerated: "n.n.",
        end: Date.now()
    });
}
