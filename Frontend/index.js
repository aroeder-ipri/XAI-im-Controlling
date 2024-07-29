async function id_api_call(){
    var apiUrl = 'https://controlling.xaidemo.de/api/id';
    const address = await fetch(apiUrl)
    .then((response) => response.json())
    .then((user) => {
        return user.id;
    });
    return address
}
function link_with_id(id){
    window.location.href = "setting.html?id=" + id;
}
function btn_click(){
    let id = id_api_call().then(id => {
        console.log(id);
        send_feedback(id)
        link_with_id(id);
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
