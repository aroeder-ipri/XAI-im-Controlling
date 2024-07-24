/* globals Chart:false */

(() => {
    'use strict';
    var apiUrl = 'https://controlling.xaidemo.de/api/id';
    fetch(apiUrl).then(response => {
      return response.json();
    }).then(data => {
      // Work with JSON data here
      console.log(data);
    }).catch(err => {
      console.log('Error', err)
    });
    function link_with_id(){
        console.log('test')
    }
})();
