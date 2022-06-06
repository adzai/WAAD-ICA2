const express = require("express");
const logger = require("./logger.js");
const dtb = require("./dtb.js");
const path = require("path");
const morgan = require("morgan");
const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const app = express();
// Require .env config only for dev environments
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const port = process.env.PORT || 3000; // Port the server will listen on

// Needed for POST request
app.use(express.json()); // parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming request object if object, with nested objects, or generally any type

// Logging HTTP requests
app.use(morgan("common"));

// Serving static frontend files, they need to be compiled first via npm run build
app.use(express.static(path.join(__dirname, "./client/public")));

const db = new dtb(
  100,
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASS,
  process.env.DB_NAME
);
db.testConnection();

// Initializing sessions, they are saved in a MySQL table
let sessionStore = new MySQLStore({}, db.pool);
app.use(
  session({
    name: process.env.SESS_NAME,
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      sameSite: true,
    },
  })
);

// Returns all questions from the db
app.get("/questions", function (req, res) {
  db.getAllQuestions(req.session.id, res);
});

// Inserts a new user to the test_table.
// POST params is a JSON in format
// {"question": questionValue, "answers": [array of 2-6 strings]}
// Returns the sql error message if there was a problem inserting
app.post("/questions", function (req, res) {
  let jsonData = req.body;
  // check whether the JSON has the correct format and there are only
  // 2-6 answers
  if (
    jsonData.hasOwnProperty("question") &&
    jsonData.hasOwnProperty("answers") &&
    jsonData.answers.length >= 2 &&
    jsonData.answers.length <= 6
  ) {
    db.insertQuestion(jsonData, req.session.id).then(res.send("Success"));
  } else {
    res.status(400).json({ error: "Incorrect POST JSON data" });
  }
});

// Returns a question with the associated answers from the db.
// The returned JSON is: {"<Name of the question>": [{"name": "<answer name>", id: <answer id>} ...]}
app.get("/questions/:id", function (req, res) {
  db.getQuestionDetail(req.params.id, res);
});

// Returns stats (number of votes for each answer) for a given question
// Return format:
// {<Answer id>:
//     {"name": "<answer name>", "counter": <number of votes>,
//         "voted": <true if user voted on this answer, false otherwise>
//     }
// ...}
app.get("/stats/:id", (req, res) => {
  try {
    db.getStats(req.params.id, req.session.id, res);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Increments the vote counter for a given answer if the user has not yet
// voted on the associated question
app.post("/answers/:id", function (req, res) {
  db.incrementAnswer(req.params.id, req.session.id, res);
});

// Deletes a question from the questions table based on provided id.
// Returns a 404 if id not found.
app.delete("/questions/:id", function (req, res) {
  db.deleteQuestion(req.params.id, req.session.id, res);
});

// Make the server listen on the defined port and log it
app.listen(port, () => {
  logger.info(`Poll app started on port ${port}`);
});
