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
			//redirect_uri: "https://notion-auth.vercel.app",
			redirect_uri: "http://localhost",
		},
	};
	axios
		.request(options)
		.then(async function (bearerAuthResponse) {
			const { Client } = require("@notionhq/client");
			const notion = new Client({ auth: bearerAuthResponse.data.access_token });

			const databases = await notion.search({
				filter: {
					property: "object",
					value: "database",
				},
			});
			let dbId;
			for (const res of databases.results) {
				console.log(res.title[0].plain_text);
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
			const result = { 
				family_id: req.body.family_id, 
				events: [],
				access_token: bearerAuthResponse.data.access_token
			};
			for (const e of events.results) {
				result.events.push({
					name: e.properties["Имя"].title[0].plain_text,
					description: "lol",
					date: new Date(e.properties["Даты"].date.start),
					family_id: req.body.family_id,
				});
			}
			const options = {
				method: "POST",
				url: "http://127.0.0.1:8000/families/create",
				data: result,
			};
			console.log(result);
			axios
				.request(options)
				.then(function (resp) {
					console.log(resp);
				})
				.catch(function (err) {
					console.log(err);
				});
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
