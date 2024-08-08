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
                timestamp: btn_click_time,
                //click_time: click_event.click_time
            })
        });

        // Überprüfen, ob die Antwort erfolgreich war
        if (!rawResponse.ok) {
            throw new Error(`HTTP error! Status: ${rawResponse.status}`);
        }

        // Versuchen, die Antwort als JSON zu parsen
        const content = await rawResponse.json();
        console.log(content);
    } catch (error) {
        console.error("Error sending feedback:", error);

        // Zusätzliche Fehlerdetails anzeigen
        console.error("Response status:", rawResponse ? rawResponse.status : 'No response');
        console.error("Response text:", rawResponse ? await rawResponse.text() : 'No response text');
    }
}
