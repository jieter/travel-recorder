var map = L.map('map', {
	center: [55, 4.6],
	zoom: 6,
	zoomControl:false
});

var Thunderforest_Outdoors = L.tileLayer('http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);
// var tilelayer = L.tileLayer('tiles/{z}/{x}/{y}.png', {
// 	maxZoom: 13,
// 	maxNativeZoom: 12,
// 	minZoom: 4
// }).addTo(map);
// var Hydda_Full = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
// 	minZoom: 0,
// 	maxZoom: 18,
// 	attribution: 'Tiles courtesy of <a href="http://hot.openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
// }).addTo(map);
var norway = L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=norges_grunnkart&zoom={z}&x={x}&y={y}', {
			name: 'Enkelt',
			attribution: '&copy; <a href="http://kartverket.no/">Kartverket</a>'
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
	'kartverket': norway,
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

var displayLog = function(logdate, data) {
	data = data.split('\n').map(function(row) {
		var fields = row.split(';');

		if (fields.length < 5) {
			return false;
		}

		return {
			date: logdate,
			time: fields[0],
			latlng: [+fields[1], +fields[2]],
			speed: +fields[3] * 1.852,
		};
	}).filter(function(record) {
		return record.speed > 4;
	});

	var latlngs = [];

	data.forEach(function(record) {
		latlngs.push(record.latlng);
	});

	var p = L.polyline(latlngs, {color: 'red', weight: 3})
		.on('click', function (){
			info('Datum: ' + data[0].date + ' <br />Dagafstand: ' + p.distanceTraveled());
		})
		.addTo(lines);
	return p;

}

$.get('data/index.txt', function (data) {
	var logs = data.split('\n');

	logs.forEach(function (filename) {
		if (filename == '') {
			return;
		}
		console.log('getting ' + filename)
		$.get('data/' + filename, function (data) {
			var line = displayLog(filename.substr(0, 10), data);
			console.log(filename.substr(0, 10), line.distanceTraveled())
		});
	});

});

var infoControl = L.control();
infoControl.options.position = 'topleft';
infoControl.onAdd = function () {
	return infoDiv;
};
infoControl.addTo(map);



// var update = function () {
// 	$.getJSON('data/current.txt', function (data) {
// 		if (data.message) {
// 			info(data.message);
// 		} else {
// 			info(data.speed + 'km/h');
// 			current.setLatLng(data.location)
// 		}
// 	})

// }

// setInterval(update, 1500);
