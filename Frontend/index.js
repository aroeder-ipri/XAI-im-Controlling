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

function link_with_id(id){
    
}
function btn_click(){
    let id = id_api_call().then(id => {
        console.log(id);
        send_feedback(id)
        window.location.href = "setting.html?id=" + id;
    });

};

function send_feedback(id) {
    let btn_click_time = Date.now();
        (async () => {
              const rawResponse = await fetch("https://controlling.xaidemo.de/api/clicks", {
                  method: 'POST',
                  headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      user_id: id
                      //timestamp: btn_click_time,
                      //click_time: click_event.click_time
                  })
              });
              const content = await rawResponse.json();
              //console.log(content)
          })();
};
