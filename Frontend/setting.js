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
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    window.location.href = "dashboard.html?id=" + id;
};