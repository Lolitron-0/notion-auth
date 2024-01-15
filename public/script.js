window.onload = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get("success") === "1") {
		document.getElementById("content").innerHTML = `
    <p class="title">Успешная авторизация!</p>
    <p class="text">Можно возвращаться в бота</p>
    `;
		document.getElementById("success-icon").style.display = "block";
	} else if(urlParams.get("error") === "1"){
        document.getElementById("content").innerHTML = `
        <p class="title">Произошла ошибка!</p>
        <p class="text">Свяжитесь с <a class="link" href="https://t.me/lolitron">@lolitron</a> в Telegram</p>
        `;
		document.getElementById("error-icon").style.display = "block";
	}
};
