window.onload = async function () {
	const urlParams = new URLSearchParams(window.location.search);

	if (urlParams.get("update")) {
        document.getElementById("tree").style.display = "none";
		document.getElementById("upd-request").style.display = "flex";
	} else {
		const id = urlParams.get("id");

		var req = new XMLHttpRequest();
		req.open("POST", "tree_data");
		req.setRequestHeader("Content-Type", "application/json");

		req.send(
			JSON.stringify({
				id: id,
			})
		);
		req.onreadystatechange = function () {
			if (req.readyState == 4 && req.status == 200) {
				const respJson = JSON.parse(req.responseText);
				console.log(req.responseText);
				if (respJson.err) {
					alert(respJson.err);
				} else {
                    FamilyTree.templates.tommy.defs = `<style>
                    .{randId} .bft-edit-form-header, .{randId} .bft-img-button{
                        background-color: #aeaeae;
                    }
                    .{randId}.male .bft-edit-form-header, .{randId}.male .bft-img-button{
                        background-color: #817f82;
                    }        
                    .{randId}.male div.bft-img-button:hover{
                        background-color: #8d5bc1;
                    }
                    .{randId}.female .bft-edit-form-header, .{randId}.female .bft-img-button{
                        background-color: #8d5bc1;
                    }        
                    .{randId}.female div.bft-img-button:hover{
                        background-color: #817f82;
                    }
</style>`;

					FamilyTree.templates.tommy_male = Object.assign(
						{},
						FamilyTree.templates.tommy
					);
					FamilyTree.templates.tommy_male.node =
						'<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#8d5bc1" stroke="#aeaeae" rx="7" ry="7"></rect>';
					FamilyTree.templates.tommy_female = Object.assign(
						{},
						FamilyTree.templates.tommy
					);
					FamilyTree.templates.tommy_female.node =
						'<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#817f82" stroke="#aeaeae" rx="7" ry="7"></rect>';

					let family = new FamilyTree(
						document.getElementById("tree"),
						{
							nodeBinding: {
								field_0: "name",
							},
							nodes: respJson,
							editForm: {
								readOnly: true,
								buttons: { share: null, pdf: null },
								generateElementsFromFields: false,
								elements: [
									{
										type: "textbox",
										label: "Полное имя",
										binding: "name",
									},
									{
										type: "textbox",
										label: "Пол",
										binding: "gender",
									},
								],
							},
							// state: {
							// 	name: "treeState",
							// 	readFromLocalStorage: true,
							// 	writeToLocalStorage: true,
							// 	readFromUrlParams: true,
							// 	writeToUrlParams: true,
							// },
						}
					);
				}
			} else if (req.readyState == 4) {
				console.log(req.responseText);
				//window.location.href = "/?error=1";
			}
		};
	}
};
