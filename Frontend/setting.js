function btn_click(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    //Post-Request ans Backend
    window.location.href = "setting2.html?id=" + id;
};
