const express = require("express");
const logger = require("./logger.js");
const path = require("path");
const morgan = require("morgan");
const mysql = require("mysql");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const app = express();

// Needed for POST request
app.use(express.json()); // parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming request object if object, with nested objects, or generally any type

// Logging HTTP requests
app.use(morgan("common"));

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const port = process.env.PORT || 3000; // Port the server will listen on
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

// Returns all questions
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

async function insertQuestion(req, res) {
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
      [req.body.question, req.session.id],
      async (err, data) => {
        if (err) {
          logger.error(err);
        } else {
          logger.debug(`Question inserted by id ${req.session.id}`);
          logger.debug(`Data: ${JSON.stringify(data)}`);
          for (const answer of req.body.answers) {
            await connection.query(
              "INSERT INTO answers(name,question_id) VALUES(?,?)",
              [answer, data.insertId],
              async (err, data) => {
                if (err) {
                  logger.error(err);
                } else {
                  logger.debug(`Answer inserted by id ${req.session.id}`);
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
// POST params are: id, name, value
// Returns the sql error message if there was a problem inserting
app.post("/questions", function (req, res) {
  insertQuestion(req, res).then();
  res.send();
});

app.get("/questions/:id", function (req, res) {
  pool.query(
    "SELECT DISTINCT q.name as question_name, a.name, a.counter, a.id FROM answers a LEFT JOIN questions q ON q.id=a.question_id LEFT JOIN users_answers ua ON ua.answer_id=a.id WHERE q.id=? ORDER BY a.id",
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
