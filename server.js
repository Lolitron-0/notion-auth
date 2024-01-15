require("dotenv").config();
const express = require("express");
const app = express();
const axios = require('axios');

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_KEY });

// http://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname + "/public"));
app.use(express.json()); // for parsing application/json

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
	// const databases = await notion.search({
	// 	filter: {
	// 	  property: "object",
	// 	  value: "database",
	// 	},
	//   })
	res.sendFile("index.html");
});

app.get("/auth", (req, res) => {
	const options = {
		method: "POST",
		url: "https://api.notion.com/v1/oauth/token",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization:
				"Basic " +
				Buffer.from(
					process.env.NOTION_CLIENT_ID +
						":" +
						process.env.NOTION_CLIENT_SECRET,
					"base64"
				).toString("base64"),
		},
		data: {
			grant_type: "authorization_code",
			code: req.query.code,
			redirect_uri: "https://notion-auth.vercel.app",
		},
	};
	axios
		.request(options)
		.then(function (response) {
			res.json(response.data);
		})
		.catch(function (error) {
			console.error(error);
		});
	res.json({
		body: req.body,
		query: req.query,
		params: req.params,
		path: req.path,
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
