const mysql = require("mysql");
const logger = require("./logger.js");

// Initializes a connection pool with up to 100 connections,
// credentials are taken from environment variables
let pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Class holding the connection pool and related functions to
// fetch, update, delete and insert data to and from the db
class Dtb {
  constructor(connectionNum, dbHost, dbUser, dbPass, dbName) {
    this.pool = mysql.createPool({
      connectionLimit: connectionNum,
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName,
    });
  }
  // Checks whether a connection to the db can be established, if not
  // the process exits
  testConnection() {
    this.pool.query("SELECT * FROM questions LIMIT 1", (err, data) => {
      if (err) {
        logger.error("error: " + err.message);
        process.exit(1);
      }
      logger.info("Connected to the MySQL server.");
    });
  }
  // Incrementing the number of votes for a given answer
  async incrementAnswer(id, sessionId, res) {
    const connection = await new Promise((resolve, reject) => {
      this.pool.getConnection((ex, connection) => {
        if (ex) {
          reject(ex);
        } else {
          resolve(connection);
        }
      });
    });
    // Called in a transaction to ensure that only one user at the time
    // can increment the vote, avoiding a data race
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
            res.send("Internal server error");
          } else if (data.length !== 0) {
            logger.debug(JSON.stringify(data));
            logger.info("User already voted!");
            res.send("User already voted!");
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
              res.send("Success");
            } else {
              let msg = "No data found";
              logger.info(msg);
              res.send(msg);
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
  // Inserts questions and answers to the db
  async insertQuestion(jsonData, sessionId) {
    const connection = await new Promise((resolve, reject) => {
      this.pool.getConnection((ex, connection) => {
        if (ex) {
          reject(ex);
        } else {
          resolve(connection);
        }
      });
    });
    try {
      // Called in a transaction because there are 2 inserts happening,
      // if the second query fails the previous must fail too
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

  // Returns vote statistics for a given question. Also returns info about
  // which question the user voted on
  getStats(questionId, sessionId, res) {
    this.pool.query(
      "SELECT answer_id FROM answers a LEFT JOIN users_answers ua ON ua.answer_id=a.id WHERE a.question_id=? AND ua.session_id=?",
      [questionId, sessionId],
      (err, data) => {
        if (err) {
          throw err;
        } else if (data.length !== 0) {
          this.pool.query(
            "SELECT DISTINCT id, name, counter, session_id FROM answers LEFT JOIN users_answers ON answers.id = users_answers.answer_id WHERE question_id=?",
            [questionId],
            (err, data) => {
              if (err) {
                throw err;
              } else {
                let collected = {};
                for (const elements of data) {
                  const key = collected[elements.id];
                  if (!key || !key.voted) {
                    collected[elements.id] = {
                      name: elements.name,
                      counter: elements.counter,
                      voted: elements.session_id === sessionId,
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
  }
  // Deletes a question from the database if the user created the question
  deleteQuestion(questionId, sessionId, res) {
    this.pool.query(
      "DELETE FROM questions WHERE id=? AND session_id=?",
      [questionId, sessionId],
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
  }
  // Returns all questions from db and information whether the user can
  // delete a particular question
  getAllQuestions(sessionId, res) {
    this.pool.query(
      "SELECT id, name, session_id=? as canDelete FROM questions ORDER BY id DESC",
      [sessionId],
      (err, data) => {
        if (err) {
          logger.error(err);
          res.status(500).json({ error: "Internal server error" });
        } else {
          logger.debug(
            `Questions requested by id ${sessionId} fetched successfully`
          );
          res.send(data);
        }
      }
    );
  }
  // Returns a question and its associated answers
  getQuestionDetail(questionId, res) {
    this.pool.query(
      "SELECT q.name as question_name, a.name, a.counter, a.id FROM answers a LEFT JOIN questions q ON q.id=a.question_id WHERE q.id=? ORDER BY a.id",
      [questionId],
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
  }
}
module.exports = Dtb;
