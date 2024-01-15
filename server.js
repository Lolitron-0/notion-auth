require("dotenv").config();
const express = require("express");
const app = express();

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_KEY });

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.use(express.json()); // for parsing application/json

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
	response.sendFile(__dirname + "/views/index.html");
});

app.get("/auth", (request, response) => {
	response.json({request})
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