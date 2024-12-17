require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
let bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Define URL schema for MongoDB
const Schema = mongoose.Schema;

const URLSchema = new Schema({
	original_url: String,
	short_url: Number,
});

// Create a Model
let URL = mongoose.model("URL", URLSchema);

// (2) You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. 
// Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}
app.use(bodyParser.urlencoded({extended: false}));

app.post('/api/shorturl', async function(req, res) {
	const myUrl = req.body.url;  // using a let instead of var or const causes the value to be erased for some reason.

	// (4) If you pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain { error: 'invalid url' }
	const urlRegex1 = new RegExp(/https:\/\//i);
	const urlRegex2 = new RegExp(/http:\/\//i);
	if (!urlRegex1.test(myUrl) && !urlRegex2.test(myUrl)) {
		res.json({ error: 'invalid url'});
	} else {
		
		// Search for an existing record document
		const urlSearch = await URL.findOne({ original_url: myUrl}); // we need async function and await for results to return before proceeding with conditional statements.
		// console.log(urlSearch);
		
		if (urlSearch) {
			res.json({ original_url: urlSearch.original_url,
						short_url: urlSearch.short_url
					});
		} else {
			// Count the number of documents in the DB
			var count = await URL.countDocuments({});
			// console.log('document count is: ' + count);
			
			// Create a record of our model, and increase the short_url by one.
			const urlEntry = new URL({ 
				original_url: myUrl,
				short_url: count + 1
			});

			await urlEntry.save();
			res.json({ original_url: urlEntry.original_url,
				short_url: urlEntry.short_url
			});
		}
	}

})

// (3) When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
app.get('/api/shorturl/:shorturl', async (req, res) => {
	var path = req.params.shorturl;
	const urlSearch = await URL.findOne({ short_url: path });
	if (urlSearch) {
		res.redirect(urlSearch.original_url);
	}
	else {
		res.send("short url path not found...");
	}
})




// Delete all records in the DB
app.get('/api/delete', async (req, res, next) => {
	var count = await URL.countDocuments({});
	console.log('deleting ' + count + ' documents...');
	await URL.deleteMany({});
	res.redirect('/');
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
