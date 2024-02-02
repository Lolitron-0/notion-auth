require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const cookieParser = require("cookie-parser");

const staticDir = __dirname + "/public";
app.use(express.static(staticDir));
app.use(express.json()); // for parsing application/json
app.use(cookieParser());

async function requestEvents(access_token, family_id) {
	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: access_token });

	const databases = await notion.search({
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

/*
	{
		"access_token": "token"
	}
*/
app.post("/update_places", async function (req, res) {
	const { Client } = require("@notionhq/client");
	const notion = new Client({ auth: req.body.access_token });

	const pageQuery = await notion.search({
		query: "Карта",
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

	// https://notion-auth.vercel.app/map?update=1
	let url = "https://notion-auth.vercel.app/map?coords=";
	for (const place of places) {
		url +=
			place.name +
			"," +
			place.coords[0].toString() +
			"," +
			place.coords[1].toString() +
			",";
	}
	if (url.at(-1) === ",") url = url.slice(0, url.length - 1);

	const response = await notion.blocks.update({
		block_id: embedBlock.id,
		embed: {
			caption: [],
			url: url,
		},
	});

	res.json(response);
});

app.post("/auth", async (req, res) => {
	console.log(req.body.family_id);
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
			//redirect_uri: "https://notion-auth.vercel.app",
			redirect_uri: "http://localhost",
		},
	};
	axios
		.request(options)
		.then(async function (bearerAuthResponse) {
			console.log(bearerAuthResponse.data.access_token);
			const eventsResult = await requestEvents(
				bearerAuthResponse.data.access_token,
				req.body.family_id
			);
			const options = {
				method: "POST",
				url: "http://127.0.0.1:8000/families/create",
				data: eventsResult,
			};
			console.log(eventsResult);
			axios
				.request(options)
				.then(function (resp) {
					console.log("ok");
				})
				.catch(function (err) {
					console.log("err");
				});
			res.sendStatus(200);
		})
		.catch(function (error) {
			//console.log(error);
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

const listener = app.listen(process.env.PORT, function () {
	console.log("Your app is listening on port " + listener.address().port);
});

module.exports = app;
