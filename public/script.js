window.onload = () => {
	const urlParams = new URLSearchParams(window.location.search);

	if (urlParams.get("success") === "1") {
		document.getElementById("content").innerHTML = `
    <p class="title">Успешная авторизация!</p>
    <p class="text">Можно возвращаться в бота</p>
    `;
		document.getElementById("success-icon").style.display = "block";
	} else if (urlParams.get("error") === "1") {
		document.getElementById("content").innerHTML = `
        <p class="title">Произошла ошибка!</p>
        <p class="text">Свяжитесь с <a class="link" href="https://t.me/lolitron">@lolitron</a> в Telegram</p>
        `;
		document.getElementById("error-icon").style.display = "block";
	} else if (urlParams.get("family_id")) {
		localStorage.setItem("family_id", urlParams.get("family_id"));
	} else {
		document.getElementById("spinner").style.display = "block";
		document.getElementById("content").innerHTML = `
		<p class="title">Обработка данных</p>
		<p class="text">Пожалуйста подождите...</p>
		`;
		var req = new XMLHttpRequest();
		req.open("POST", "auth");
		req.setRequestHeader("Content-Type", "application/json");
		req.send(
			JSON.stringify({
				code: urlParams.get("code"),
				family_id: localStorage.getItem("family_id"),
			})
		);
		req.onreadystatechange = function () {
			if (req.readyState == 4 && req.status == 200) {
				window.location.href = "/?success=1";
			} else {
				window.location.href = "/?error=1";
			}
		};
	}
};
