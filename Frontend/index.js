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
                timestamp: btn_click_time
                //click_time: click_event.click_time
            })
        });
        
        if (!rawResponse.ok) {
            throw new Error(`HTTP error! Status: ${rawResponse.status}`);
        }

        const content = await rawResponse.json();
        console.log(content);
    } catch (error) {
        console.error("Error sending feedback:", error);
    }
}
