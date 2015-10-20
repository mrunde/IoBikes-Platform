var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	});
	
var cycle =	L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://opencyclemap.org">OpenCycleMap</a> contributors'
	});

var osm_hot = new L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		attribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	});
	
var baseMaps = {
	"OSM": osm,
    "Cycle Map": cycle,
	"Humanitarian": osm_hot
};
/*
var dev15E2C;
var dev154F4;
var overlayMaps = {
    "Device 15E2C": dev15E2C,
	"Device 154F4": dev154F4
};
*/

var map = L.map('map', {
	center: [51.969608, 7.595912],
	zoom: 14,
	layers: [osm_hot]
});

L.control.layers(baseMaps).addTo(map);

var dev_id = "15E2C";
var markers = new L.MarkerClusterGroup();

var ajax = new XMLHttpRequest();
var url = 'http://giv-iob.uni-muenster.de/node/api/test/' + dev_id;
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
		
	markers.addLayer(geojson);
	map.addLayer(markers);

}
ajax.open("GET", url, true);
ajax.send(null);
 

/*
var map = L.map('map'),
    realtime = L.realtime({
        url: 'http://giv-iob.uni-muenster.de/node/api/test/15E2C',
        crossOrigin: true,
        type: 'json'
    }, {
        interval: 3 * 1000
    }).addTo(map);
*/

/*
realtime.on('update', function() {
    map.fitBounds(realtime.getBounds(), {maxZoom: 3});
});
*/