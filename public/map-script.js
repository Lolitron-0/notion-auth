function update() {
	const loadingContainer = document.getElementById("loading")
	loadingContainer.style.visibility = "visible"
	loadingContainer.style.opacity = 1

	const urlParams = new URLSearchParams(window.location.search);
	const id = urlParams.get("id");

	var req = new XMLHttpRequest();
	req.open("POST", "map_data");
	req.setRequestHeader("Content-Type", "application/json");

	req.send(
		JSON.stringify({
			id: id,
		})
	);


	req.onreadystatechange = function () {
		if (req.readyState != 4 || req.status != 200) {
			return;
		}

		const places = JSON.parse(req.responseText);

		ymaps.ready(function () {
			let myMap = new ymaps.Map(
				"map",
				{
					center: places[0] ? places[0].coords : [55.76, 37.64],
					zoom: 10,
					controls: ['zoomControl', 'searchControl', 'typeSelector', 'geolocationControl'],
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

			let updateButton = new ymaps.control.Button({
				data: {
					content: "Обновить данные",
				},
				options: {
					maxWidth: 500,
					float: "left",
					selectOnClick: false
				},
			});

			updateButton.events.add("click", (e) => {
				update();
			})

			myMap.controls.add(updateButton)

			document
				.querySelectorAll("[class*='ground-pane']")
				.forEach((el) => {
					el.style.filter = "saturate(0.1)";
				});

			loadingContainer.style.visibility = "hidden"
			loadingContainer.style.opacity = 0
		});

	}
}

window.onload = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get("update") === "1") {
		document.getElementById("map").style.display = "none";
		document.getElementById("upd-request").style.display = "flex";
	} else {
		update();
	}
};


