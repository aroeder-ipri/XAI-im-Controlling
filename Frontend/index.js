async function send_feedback(uuid, group) {
    try {
        const rawResponse = await fetch("https://controlling.xaidemo.de/api/clicks", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: uuid,
                group: group,
                questionButton: "n.n.",
                start: new Date().toISOString(),
                end: new Date().toISOString(),
                advice: "n.n."
            })
        });

        // Log response for debugging
        const responseText = await rawResponse.text();
        console.log("Response from API:", responseText);

        if (!rawResponse.ok) {
            throw new Error(`HTTP error! Status: ${rawResponse.status} - ${responseText}`);
        }
    } catch (error) {
        console.error("Error sending feedback:", error);
    }
}
