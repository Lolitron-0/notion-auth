require("dotenv").config();
const botIP = "5.35.88.123:80"
const express = require("express");
const app = express();
const axios = require("axios");
const cookieParser = require("cookie-parser");

const staticDir = __dirname + "/public";
app.use(express.static(staticDir));
app.use(express.json()); // for parsing application/json
app.use(cookieParser());

const { Pool } = require("pg");

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL,
});

pool.connect((err) => {
	if (err) throw err;
	console.log("Connected to PG");
});

async function requestEvents(access_token, family_id) {
	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: access_token });

	// direct events
	let databases = await notion.search({
		query: "Хранилище",
		filter: {
			property: "object",
			value: "database",
		},
	});
	let dbId = databases.results[0].id;

	const events = await notion.databases.query({
		database_id: dbId,
		filter: {
			and: [
				{
					property: "Тип",
					select: {
						equals: "Событие",
					},
				},
			],
		},
	});
	const result = {
		family_id: Number(family_id),
		events: [],
		access_token: access_token,
	};
	for (const e of events.results) {
		result.events.push({
			name: e.properties["Имя"].title[0].plain_text,
			description: "lol",
			date: new Date(e.properties["Даты"].date.start),
			family_id: Number(family_id),
		});
	}

	// events from people
	databases = await notion.search({
		query: "Люди",
		filter: {
			property: "object",
			value: "database",
		},
	});
	dbId = databases.results[0].id;
	const peopleEvents = await notion.databases.query({
		database_id: dbId,
		// filter: {
		// 	and: [
		// 		{
		// 			property: "Тип",
		// 			select: {
		// 				equals: "Событие",
		// 			},
		// 		},
		// 	],
		// },
	});
	console.log(peopleEvents.results.length);
	//console.log(peopleEvents);
	for (const e of peopleEvents.results) {
		const dateObj = e.properties["Рождение / Смерть"].date;
		const name = e.properties["Полное имя"].title[0].plain_text;

		if (dateObj) {
			result.events.push({
				name: "Родился " + name,
				description: "lol",
				date: new Date(dateObj.start),
				family_id: Number(family_id),
			});

			if (dateObj.end) {
				result.events.push({
					name: "Умер " + name,
					description: "lol",
					date: new Date(dateObj.end),
					family_id: Number(family_id),
				});
			}
		}

	}
	return result;
}

app.get("/", function (req, res) {
	res.sendFile("index.html");
});

app.get("/map", function (req, res) {
	console.log(req.headers);
	console.log(req.data);
	console.log(req.query);
	res.sendFile(staticDir + "/map.html");
});

app.get("/tree", function (req, res) {
	res.sendFile(staticDir + "/tree.html");
});

app.post("/map_data", async function (req, res) {
	const rows = await pool.query(
		`select * from tokens where id=${req.body.id}`
	);

	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: rows.rows[0].secret });

	const databases = await notion.search({
		query: "Хранилище",
		filter: {
			property: "object",
			value: "database",
		},
	});
	let dbId = databases.results[0].id;

	const placesQuery = await notion.databases.query({
		database_id: dbId,
		filter: {
			and: [
				{
					property: "Тип",
					select: {
						equals: "Место",
					},
				},
			],
		},
	});

	const places = [];
	let x, y;
	for (const place of placesQuery.results) {
		x = place.properties["Широта"].rich_text[0];
		y = place.properties["Долгота"].rich_text[0];
		if (x && y) {
			x = parseFloat(x.plain_text);
			y = parseFloat(y.plain_text);
			if (x != NaN && y != NaN) {
				places.push({
					name: place.properties["Имя"].title[0].plain_text,
					coords: [x, y],
				});
			}
		}
	}

	res.json(places)

})

app.post("/tree_data", async function (req, res) {
	const rows = await pool.query(
		`select * from tokens where id=${req.body.id}`
	);

	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: rows.rows[0].secret });

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

	const personMap = new Map();
	for (const person of peopleQuery.results) {
		const parents = [];
		for (const parent of person.properties["Родители"].relation) {
			parents.push(parent.id);
		}

		let gender = undefined;
		if (person.properties["Пол"].select) {
			gender =
				person.properties["Пол"].select.name == "М" ? "male" : "female";
		} else {
			res.json({
				err: "У каждого человека в базе данных должен быть указан пол!",
			});
			return;
		}

		personMap.set(person.id, {
			id: person.id,
			parents: parents,
			gender: gender,
			//pids: parents.length == 0 ? undefined : parents,
			name: person.properties["Полное имя"].title[0].plain_text,
		});
	}
	for (let person of personMap.values()) {
		person.fid = person.parents.find(
			(id) => personMap.get(id).gender == "male"
		);
		person.mid = person.parents.find(
			(id) => personMap.get(id).gender == "female"
		);
		for (const parentId of person.parents) {
			personMap.get(parentId).pids = personMap.get(parentId).pids
				? personMap.get(parentId).pids
				: [];
			for (const otherParentId of person.parents) {
				if (
					otherParentId != parentId &&
					!personMap.get(parentId).pids.includes(otherParentId)
				) {
					personMap.get(parentId).pids.push(otherParentId);
				}
			}
		}
		person.parents = undefined;
	}

	res.json(Array.from(personMap.values()));
});


async function getEmbedUpdateBlocks(access_token) {
	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: access_token });
	let result = {}

	for (const pageName of ["Древо", "Карта"]) {
		const pageQuery = await notion.search({
			query: pageName,
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
		result[pageName] = embedBlock
	}
	return result;
}

app.post("/auth", async (req, res) => {
	const options = {
		method: "POST",
		url: "https://api.notion.com/v1/oauth/token",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization:
				"Basic " +
				Buffer.from(
					`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
				).toString("base64"),
		},
		data: {
			grant_type: "authorization_code",
			code: req.body.code,
			redirect_uri: "https://notion-auth.vercel.app",
			//redirect_uri: "http://localhost",
		},
	};
	axios
		.request(options)
		.then(async function (bearerAuthResponse) {
			const rows = await pool.query(
				`insert into tokens(secret) values('${bearerAuthResponse.data.access_token}') returning *`
			);

			const embedBlocks = await getEmbedUpdateBlocks(
				bearerAuthResponse.data.access_token
			);

			const { Client } = require("@notionhq/client");
			const notion = new Client({ auth: bearerAuthResponse.data.access_token });

			const treeUpdateResponse = await notion.blocks.update({
				block_id: embedBlocks["Древо"].id,
				embed: {
					caption: [],
					url: "https://notion-auth.vercel.app/tree?id=" + rows.rows[0].id,
				},
			});

			const mapUpdateResponse = await notion.blocks.update({
				block_id: embedBlocks["Карта"].id,
				embed: {
					caption: [],
					url: "https://notion-auth.vercel.app/map?id=" + rows.rows[0].id,
				},
			});

			const eventsResult = await requestEvents(
				bearerAuthResponse.data.access_token,
				req.body.family_id
			);
			const options = {
				method: "POST",
				url: "http://" + botIP + "/families/create",
				data: eventsResult,
			};
			console.log(eventsResult);
			axios
				.request(options)
				.then(function (resp) {
					console.log("ok");
				})
				.catch(function (err) {
					console.log(err);
				});
			res.sendStatus(200);
		})
		.catch(function (error) {
			console.log(error);
			res.sendStatus(400);
		});
});

app.get("/events", async function (req, res) {
	const eventsResult = await requestEvents(
		req.body.access_token,
		req.body.family_id
	);
	res.json(eventsResult);
});

const listener = app.listen(process.env.PORT, async function () {
	console.log("Your app is listening on port " + listener.address().port);
	await requestEvents(process.env.TEST_KEY, 50);
});

module.exports = app;
