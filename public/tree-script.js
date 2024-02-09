window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token")

	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: token });

    const pageQuery = await notion.search({
		query: "Древо",
		filter: {
			property: "object",
			value: "page",
		},
	});
	const pageId = pageQuery.results[0].id;

	const pageContent = await notion.blocks.children.list({
		block_id: pageId,
		page_size: 50,
	});

    let embedBlock;
	for (const block of pageContent.results) {
		if (block.type === "embed") embedBlock = block;
	}

	const databases = await notion.search({
		query: "Люди",
		filter: {
			property: "object",
			value: "database",
		},
	});
	let dbId = databases.results[0].id;

	const peopleQuery = await notion.databases.query({
		database_id: dbId,
	});

    const nodes = [];

    for (const person of peopleQuery.results) {
        const parents = [];
        let maleParentId, femaleParentId;
		for (const parent of person.properties["Родители"].relation) {
            console.log(parent);
			parents.push(parent.id);
		}
    }

    let family = new FamilyTree(document.getElementById("tree"), {
        nodeBinding: {
            field_0: "name"
        },
        nodes: [
            { id: 1, pids: [2], name: "Amber McKenzie", gender: "female" },
            { id: 2, pids: [1], name: "Ava Field", gender: "male" },
            { id: 3, mid: 1, fid: 2, name: "Peter Stevens", gender: "male" }  
        ],
        state: {
            name: 'treeState',
            readFromLocalStorage: true,
            writeToLocalStorage: true,
            readFromUrlParams: true,                    
            writeToUrlParams: true
        },
    });

    console.log(family.stateToUrl());
}
