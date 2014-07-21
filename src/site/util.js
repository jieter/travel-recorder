L.Polyline.include({
	_distanceMeters: function () {
		var latlngs = this.getLatLngs();

		if (latlngs.length < 2) {
			return 0;
		}

		var distance = 0;
		for (var i = 1; i < latlngs.length; i++) {
			distance += latlngs[i - 1].distanceTo(latlngs[i]);
		}

		return distance;
	}
});
