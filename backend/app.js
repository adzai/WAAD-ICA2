const express = require("express");
const logger = require("./logger.js");
const path = require("path");
const morgan = require("morgan");
const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const app = express();
const cors = require("cors");
const port = 3000; // Port the server will listen on

// Needed for POST request
app.use(express.json()); // parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming request object if object, with nested objects, or generally any type

// Logging HTTP requests
app.use(morgan("common"));

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Initializes a connection pool with up to 100 connections,
// credentials are taken from environment variables
let pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

let sessionStore = new MySQLStore({}, pool);

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
      secure: process.env.NODE_ENV === "production",
    },
  })
);

const allowedOrigins = ["http://localhost:3000", "http://localhost:8080"];

app.use(cors());

// Test connection to db
let initSQL = "SELECT * FROM questions LIMIT 1";
pool.query(initSQL, (err, data) => {
  if (err) {
    logger.error("error: " + err.message);
    process.exit(1);
  }
  logger.info("Connected to the MySQL server.");
});

// Example of incrementing answer counter
async function incrementAnswer(id) {
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(
      "UPDATE answers SET counter = counter + 1 WHERE id=?",
      [id]
    );
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    await connection.release();
  }
}

// Returns all questions
app.get("/questions", function (req, res) {
  var sql = "SELECT * FROM questions";
  pool.query(sql, [], (err, data) => {
    if (err) {
      logger.error(err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      logger.debug(
        `Questions requested by id ${req.session.id} fetched successfully`
      );
      res.send(data);
    }
  });
});

// Inserts a new user to the test_table.
// POST params are: id, name, value
// Returns the sql error message if there was a problem inserting
app.post("/questions", function (req, res) {
  // TODO: must accept answers as well
  pool.query(
    "INSERT INTO questions(name,session_id) VALUES(?,?)",
    [req.body.name, req.session.id],
    (err, data) => {
      if (err) {
        logger.error(err);
        res.status(500).json({
          error: "Couldn't insert into the database: " + err.sqlMessage,
        });
      } else {
        res.send("Success");
      }
    }
  );
});

// Deletes a question from the questions table based on provided id.
// Returns a 404 if id not found.
app.delete("/questions/:id", function (req, res) {
  pool.query(
    "DELETE FROM questions WHERE id=?",
    [req.params.id],
    (err, data) => {
      if (err) {
        res.status(404).json({ error: "ID not found" });
      } else {
        res.send("Success");
      }
    }
  );
});

// Make the server listen on the defined port and log it
app.listen(port, () => {
  logger.info(`Poll app started on port ${port}`);
});
