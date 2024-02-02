ymaps.ready(function () {
	let myMap = new ymaps.Map(
		"map",
		{
			center: [55.76, 37.64],
			zoom: 10,
		},
		{
			searchControlProvider: "yandex#search",
		}
	);
	myMap.geoObjects.add(
		new ymaps.Placemark(
			[55.687086, 37.529789],
			{
				balloonContent: "Place",
			},
			{
				preset: "islands#circleIcon",
				iconColor: "#3caa3c",
			}
		)
	);
});
