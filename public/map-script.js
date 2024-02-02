window.onload = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get("update") === "1") {
		document.getElementById("map").style.display = "none";
		document.getElementById("upd-request").style.display = "flex";
	} else {
		const places = [];
		const query = urlParams.get("coords").split(",");
		for (let i = 0; i < query.length - 2; i += 3) {
			places.push({
				name: query[0],
				coords: [parseFloat(query[i + 1]), parseFloat(query[i + 2])],
			});
		}

		ymaps.ready(function () {
			let myMap = new ymaps.Map(
				"map",
				{
					center: places[0] ? places[0].coords : [55.76, 37.64],
					zoom: 10,
				},
				{
					searchControlProvider: "yandex#search",
				}
			);

			for (const place of places) {
				myMap.geoObjects.add(
					new ymaps.GeoObject(
						{
							geometry: {
								type: "Point",
								coordinates: place.coords,
							},
							properties: {
								//iconContent: place.name,
								hintContent: place.name,
								balloonContent: place.name,
							},
						},
						{
							preset: "islands#circleIcon",
							iconColor: "#8d5bc1",
						}
					)
				);
			}

			document
				.querySelectorAll("[class*='ground-pane']")
				.forEach((el) => {
					el.style.filter = "saturate(0.1)";
				});
		});
	}
};
