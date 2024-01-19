require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const cookieParser = require("cookie-parser");

app.use(express.static(__dirname + "/public"));
app.use(express.json()); // for parsing application/json
app.use(cookieParser());

app.get("/", function (req, res) {
	res.sendFile("index.html");
});

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
		},
	};
	axios
		.request(options)
		.then(async function (response) {
			const { Client } = require("@notionhq/client");
			const notion = new Client({ auth: response.data.access_token });

			const databases = await notion.search({
				filter: {
					property: "object",
					value: "database",
				},
			});
			let dbId;
			for (const res of databases.results) {
				if (res.title[0].plain_text == "Хранилище") dbId = res.id;
			}
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
			const result = { family_id: req.body.family_id, arr: [] };
			for (const e of events.results) {
				result.arr.push({
					name: e.properties["Имя"].title[0].plain_text,
					description: "lol",
					date: e.properties["Даты"].date.start,
					family_id: req.body.family_id
				});
			}
			const options = {
				method: "POST",
				url: "https://localhost:8000/families/create",
				data: {
					telegram_id: result.family_id,
					events: result.arr,
				},
			};
			axios.request(options).then(function (resp) { }).catch(function (err) { })
			res.sendStatus(200);
		})
		.catch(function (error) {
			res.sendStatus(400);
		});
});

const listener = app.listen(process.env.PORT, function () {
	console.log("Your app is listening on port " + listener.address().port);
});

module.exports = app;
