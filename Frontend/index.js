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
    window.location.href = "dashboard.html?id=" + id;
}
function btn_click(){
    let id = id_api_call().then(id => {
        console.log(id);
        link_with_id(id)
    });

};

