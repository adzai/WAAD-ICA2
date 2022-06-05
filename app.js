const express = require("express");
const logger = require("./logger.js");
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

// Initializes a connection pool with up to 100 connections,
// credentials are taken from environment variables
let pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Initializing sessions, they are saved in a MySQL table
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
    },
  })
);

// Test the connection to db
let initSQL = "SELECT * FROM questions LIMIT 1";
pool.query(initSQL, (err, data) => {
  if (err) {
    logger.error("error: " + err.message);
    process.exit(1);
  }
  logger.info("Connected to the MySQL server.");
});

// Incrementing the number of votes for a given answer
async function incrementAnswer(id, sessionId) {
  const connection = await new Promise((resolve, reject) => {
    pool.getConnection((ex, connection) => {
      if (ex) {
        reject(ex);
      } else {
        resolve(connection);
      }
    });
  });
  try {
    await connection.beginTransaction();
    await connection.query(
      "SELECT answer_id FROM answers a LEFT JOIN users_answers ua ON ua.answer_id=a.id WHERE a.question_id=(SELECT question_id FROM answers a WHERE a.id=? LIMIT 1) AND ua.session_id=?",
      [id, sessionId],
      async (err, data) => {
        logger.debug("INFO");
        logger.debug(data);
        if (err) {
          logger.error(err);
        } else if (data.length !== 0) {
          logger.debug(JSON.stringify(data));
          logger.info("User already voted!");
        } else {
          if (data.length === 0) {
            await connection.query(
              "UPDATE answers SET counter = counter + 1 WHERE id=?",
              [id]
            );
            await connection.query(
              "INSERT INTO users_answers (session_id, answer_id) VALUES (?,?)",
              [sessionId, id]
            );
          } else {
            logger.info("No data found");
          }
        }
      }
    );
    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    await connection.release();
  }
}

// Returns all questions from the db
app.get("/questions", function (req, res) {
  const sql =
    "SELECT id, name, session_id=? as canDelete FROM questions ORDER BY id DESC";
  pool.query(sql, [req.session.id], (err, data) => {
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

// Inserts questions and answers to the db
async function insertQuestion(jsonData, sessionId) {
  const connection = await new Promise((resolve, reject) => {
    pool.getConnection((ex, connection) => {
      if (ex) {
        reject(ex);
      } else {
        resolve(connection);
      }
    });
  });
  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO questions(name,session_id) VALUES(?,?)",
      [jsonData.question, sessionId],
      async (err, data) => {
        if (err) {
          logger.error(err);
        } else {
          logger.debug(`Question inserted by id ${sessionId}`);
          logger.debug(`Data: ${JSON.stringify(jsonData)}`);
          for (const answer of jsonData.answers) {
            await connection.query(
              "INSERT INTO answers(name,question_id) VALUES(?,?)",
              [answer, data.insertId],
              async (err, data) => {
                if (err) {
                  logger.error(err);
                } else {
                  logger.debug(`Answer inserted by id ${sessionId}`);
                }
              }
            );
          }
        }
      }
    );
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    await connection.release();
  }
}
// Inserts a new user to the test_table.
// POST params is a JSON in format
// {"question": questionValue, "answers": [array of 2-6 strings]}
// Returns the sql error message if there was a problem inserting
app.post("/questions", function (req, res) {
  let jsonData = req.body;
  if (
    jsonData.hasOwnProperty("question") &&
    jsonData.hasOwnProperty("answers") &&
    jsonData.answers.length >= 2 &&
    jsonData.answers.length <= 6
  ) {
    insertQuestion(jsonData, req.session.id).then(res.send("Success"));
  } else {
    res.status(400).json({ error: "Incorrect POST JSON data" });
  }
});

// Returns a question with the associated answers from the db.
// The returned JSON is: {"<Name of the question>": [{"name": "<answer name>", id: <answer id>} ...]}
app.get("/questions/:id", function (req, res) {
  pool.query(
    "SELECT q.name as question_name, a.name, a.counter, a.id FROM answers a LEFT JOIN questions q ON q.id=a.question_id WHERE q.id=? ORDER BY a.id",
    [req.params.id],
    (err, data) => {
      if (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (data.length === 0) {
          res.send({});
        } else {
          const key = data[0].question_name;
          let ret = {};
          ret[key] = [];
          for (const item of data) {
            ret[item.question_name].push({
              name: item.name,
              id: item.id,
            });
          }
          res.send(ret);
        }
      }
    }
  );
});

// Returns stats (number of votes for each answer) for a given question
// Return format:
// {<Answer id>:
//     {"name": "<answer name>", "counter": <number of votes>,
//         "voted": <true if user voted on this answer, false otherwise>
//     }
// ...}
app.get("/stats/:id", (req, res) => {
  pool.query(
    "SELECT answer_id FROM answers a LEFT JOIN users_answers ua ON ua.answer_id=a.id WHERE a.question_id=? AND ua.session_id=?",
    [req.params.id, req.session.id],
    (err, data) => {
      if (err) {
        logger.error(err);
      } else if (data.length !== 0) {
        pool.query(
          "SELECT DISTINCT id, name, counter, session_id FROM answers LEFT JOIN users_answers ON answers.id = users_answers.answer_id WHERE question_id=?",
          [req.params.id],
          (err, data) => {
            if (err) {
              res.status(500).json({ error: "Internal server error" });
            } else {
              let collected = {};
              for (const elements of data) {
                const key = collected[elements.id];
                if (!key || !key.voted) {
                  collected[elements.id] = {
                    name: elements.name,
                    counter: elements.counter,
                    voted: elements.session_id === req.session.id,
                  };
                }
              }
              res.send(collected);
            }
          }
        );
      } else {
        res.send([]);
      }
    }
  );
});

// Increments the vote counter for a given answer if the user has not yet
// voted on the associated question
app.post("/answers/:id", function (req, res) {
  incrementAnswer(req.params.id, req.session.id);
  res.send();
});

// Deletes a question from the questions table based on provided id.
// Returns a 404 if id not found.
app.delete("/questions/:id", function (req, res) {
  pool.query(
    "DELETE FROM questions WHERE id=? AND session_id=?",
    [req.params.id, req.session.id],
    (err, data) => {
      if (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (data.affectedRows === 0) {
          res.send("No questions deleted");
        } else {
          res.send("Success");
        }
      }
    }
  );
});

// Make the server listen on the defined port and log it
app.listen(port, () => {
  logger.info(`Poll app started on port ${port}`);
});
