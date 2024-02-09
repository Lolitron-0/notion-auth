window.onload = async function () {
	const urlParams = new URLSearchParams(window.location.search);
	const token = urlParams.get("access_token");

	var req = new XMLHttpRequest();
	req.open("POST", "tree_data");
	req.setRequestHeader("Content-Type", "application/json");

	req.send(JSON.stringify({
		access_token: token,
	}));
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == 200) {
			const respJson = JSON.parse(req.responseText)
			console.log(req.responseText)
			if (respJson.err) {
				alert(respJson.err)
			}
			else {
				let family = new FamilyTree(document.getElementById("tree"), {
					nodeBinding: {
						field_0: "name",
					},
					nodes: respJson,
					// state: {
					// 	name: "treeState",
					// 	readFromLocalStorage: true,
					// 	writeToLocalStorage: true,
					// 	readFromUrlParams: true,
					// 	writeToUrlParams: true,
					// },
				});
			}
		} else if (req.readyState == 4) {
			console.log(req.responseText);
			//window.location.href = "/?error=1";
		}
	};
};
