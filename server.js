require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const cookieParser = require("cookie-parser");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + "/public"));
app.use(express.json()); // for parsing application/json
app.use(cookieParser());

const families_clients = new Map();

// http://expressjs.com/en/starter/basic-routing.html
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
			redirect_uri: "http://localhost",
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
					data: e.properties["Даты"].date,
				});
			}
			console.log(result);
			const options = {
				method: "POST",
				url: "https://api.notion.com/v1/oauth/token",
				data: {
					grant_type: "authorization_code",
					code: req.query.code,
					redirect_uri: "http://localhost/auth",
				},
			};
			res.redirect("/?success=1");
		})
		.catch(function (error) {
			res.redirect("/?error=1");
		});
});

// Create new page comments. The page ID is provided in the web form.
app.post("/comments", async function (request, response) {
	const { pageID, comment } = request.body;

	try {
		const newComment = await notion.comments.create({
			parent: {
				page_id: pageID,
			},
			rich_text: [
				{
					text: {
						content: comment,
					},
				},
			],
		});
		response.json({ message: "success!", data: newComment });
	} catch (error) {
		response.json({ message: "error", error });
	}
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
	console.log("Your app is listening on port " + listener.address().port);
});

module.exports = app;
