var map = L.map('map').setView([51.969608, 7.595912], 14);

var ajax = new XMLHttpRequest();
var url = "http://giv-iob.uni-muenster.de/node/api/test/15E2C";
var data;

ajax.onreadystatechange = function() {
    if (ajax.readyState == 4 && ajax.status == 200) {
        data = JSON.parse(ajax.responseText);
    }
	var geojson = L.geoJson(data, {
      onEachFeature: function (feature, layer) {
        if (feature.properties) {
                var popupString = '<div class="popup">';
                for (var k in feature.properties) {
                    var v = feature.properties[k];
                    popupString += k + ': ' + v + '<br />';
                }
                popupString += '</div>';
                layer.bindPopup(popupString, {
                    maxHeight: 200
                });
            }
      }
    });
    map.fitBounds(geojson.getBounds());
	
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
	
    geojson.addTo(map);

}
ajax.open("GET", url, true);
ajax.send(null);

