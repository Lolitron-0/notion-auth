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
				iconColor: "#8d5bc1",
			}
		)
	)
    myMap.geoObjects.add(
		new ymaps.Placemark(
			[55.677016, 37.549789],
			{
				balloonContent: "Place",
			},
			{
				preset: "islands#circleIcon",
				iconColor: "#8d5bc1",
			}
		)
	)
    myMap.geoObjects.add(
		new ymaps.Placemark(
			[55.681086, 37.519719],
			{
				balloonContent: "Place",
			},
			{
				preset: "islands#circleIcon",
				iconColor: "#8d5bc1",
			}
		)
	)
    myMap.geoObjects.add(
		new ymaps.Placemark(
			[55.617086, 37.521689],
			{
				balloonContent: "Place",
			},
			{
				preset: "islands#circleIcon",
				iconColor: "#8d5bc1",
			}
		)
	)
    document.querySelectorAll("[class*='ground-pane']").forEach((el)=>{
        el.style.filter = "saturate(0.1)";
    })
});
