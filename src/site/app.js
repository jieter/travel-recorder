var map = L.map('map', {
	center: [52, 4.6],
	zoom: 9,
	zoomControl:false
});
var offlineLayer = L.tileLayer('tiles/{z}/{x}/{y}.png', {
	maxZoom: 13,
	maxNativeZoom: 12,
	minZoom: 4
}).addTo(map);

// Infowindow.
var infoDiv = L.DomUtil.create('div', 'info');
var info = function (html) {
	infoDiv.innerHTML = html;
};

var lpg = L.layerGroup();
var heenweg = L.geoJson(null, {style: style});
var lines = L.layerGroup().addTo(map);
var points = L.layerGroup();
var current = L.marker([0, 0]);


var layersControl = L.control.layers({}, {
	'LPG Noorwegen': lpg,
	'Heenweg': heenweg,
	'Daglogs': lines,
	'logpoints': points,
	'current': current
}).addTo(map);

var style = function () {
	return {
		color: 'blue',
		weight: 1
	}
};

$.getJSON('layers/route-delft-hirtshals.geojson', function (data) {
	heenweg.addData(data);
});

$.getJSON('layers/poi.geojson', function (data) {
	layersControl.addOverlay(L.geoJson(data, {
		style: style,
		pointToLayer: function (data, latlng) {
			return L.marker(latlng).bindPopup(data.properties.name);
		}
	}), 'Eigen POIs');
})
$.get('layers/lpg-poi.csv', function (data) {
	var rows = data.split('\n');

	rows.forEach(function(row) {
		var fields = row.split(',');

		fields[0] = +fields[0];
		fields[1] = +fields[1];
		if (fields.length < 3 || fields[0] > 10 || fields[1] > 60) {
			return;
		}
		var marker = L.circleMarker([
			fields[1],
			fields[0]
		]).bindPopup(fields[2]);

		lpg.addLayer(marker);
	});

});

var displayLog = function(data) {
	var rows = data.split('\n');

	var latlngs = [];

	rows.forEach(function(row) {
		var fields = row.split(';');
		if (fields.length < 5) {
			return;
		}

		var latlng = [
			+fields[1],
			+fields[2]
		]

		latlngs.push(latlng);

		var speed = +fields[3] * 1.852;


		L.circleMarker(latlng, {
			radius: 5,
			color: speed > 90 ? 'blue' : 'red'
		})
			.bindPopup('Snelheid: ' + (Math.round(speed * 10) / 10) + 'km/h')
			.addTo(points);
	});

	var p = L.polyline(latlngs, {color: 'red', weight: 3})
		.on('click', function (){
			info('Dagafstand: ' + (Math.round(p._distanceMeters()/100) / 10) + 'km');
		})
		.addTo(lines);
}

$.get('data/index.txt', function (data) {
	var logs = data.split('\n');

	logs.forEach(function (filename) {
		$.get('data/' + filename, displayLog);
	});

});

var infoControl = L.control();
infoControl.options.position = 'topleft';
infoControl.onAdd = function () {
	return infoDiv;
};
infoControl.addTo(map);



var update = function () {
	$.getJSON('data/current.txt', function (data) {
		if (data.message) {
			info(data.message);
		} else {
			info(data.speed + 'km/h');
			current.setLatLng(data.location)
		}
	})

}

setInterval(update, 1500);
