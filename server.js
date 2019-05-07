const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
// const db = require("./models");
const db = mongoose.connection;

const PORT = 8080;

// Initialize Express
const app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));

// Make public a static folder
app.use(express.static("public"));


/*********** Database configuration **********/

// Connect to the Mongo DB
const databaseUri = 'mongodb://localhost/scrapeHw';

if (process.env.MONDGODB_URI) {
    //THIS EXECUTES IF THIS IS BEING EXECUTED IN HEROKU APP
    mongoose.connect(process.env.MONDGODB_URI);
} else {
    //THIS EXECUTES IF THIS IS BEING EXECUTED ON LOCAL MACHINE
    mongoose.connect(databaseUri);
}
/*********** End of Database Config *************/

//show any mongoose errors
db.on('error', function (err) {
    console.log('Mongoose Error: ', err);
});

//once logged in to the db through mongoose log a sucess message
db.once('open', function () {
    console.log('Mongoose connection successful.');
});

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.echojs.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        const $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article h2").each(function (i, element) {
            // Save an empty result object
            let result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send("Scrape Complete");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // TODO: Finish the route so it grabs all of the articles
    db.Article.find({})
        .then(function (dbArticles) {
            res.json(dbArticles)
        })
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
    db.Article.findById(req.params.id)
        .then(function (artId) {
            res.json(artId)
        })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
    db.Article.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({}, { $push: { note: dbNote._id } }, { new: true });

        })
        .then(function (noteId) {
            res.json(noteId)
        })
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
