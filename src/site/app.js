var map = L.map('map', {
	center: [52, 4.6],
	zoom: 12
});
var layersControl = L.control.layers()
map.addLayer(L.tileLayer.provider('Stamen.TonerLite'));

$.get('2014-07-20-log.csv', function(data) {
	var rows = data.split('\n');

	var latlngs = [];
	var p = L.polyline([], {color: 'red', weight: 3}).addTo(map);

	rows.forEach(function(row) {
		var fields = row.split(';');
		if (fields.length < 3) {
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
			.addTo(map)
	});
	p.setLatLngs(latlngs);
	console.log(Math.round(p._distanceMeters()) / 1000);
});
