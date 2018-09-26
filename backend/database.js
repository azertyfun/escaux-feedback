const sqlite3 = require('sqlite3').verbose();

// Erases any existing table and recreates them new. This completely nukes any data and should only be used for development purposes or when creating a new database (which is done automatically).
rebuildDatabase = () => {
    this.db.parallelize(() => {
        this.db.serialize(() => {
            this.db.run('DROP TABLE IF EXISTS feedback');
            this.db.run(`CREATE TABLE feedback(
                id INTEGER PRIMARY KEY,
                parent INTEGER,
                user TEXT NOT NULL,
                statement TEXT NOT NULL,
                score INTEGER,
                status INTEGER NOT NULL,
                wasRoot INTEGER NOT NULL,
                FOREIGN KEY(parent) REFERENCES feedback(id),
                FOREIGN KEY(user) REFERENCES users(name)
            )`);
        });
        this.db.serialize(() => {
            this.db.run('DROP TABLE IF EXISTS votes');
            this.db.run(`CREATE TABLE votes(
                id INTEGER PRIMARY KEY,
                feedback INTEGER NOT NULL,
                value INTEGER NOT NULL,
                user INTEGER NOT NULL,
                FOREIGN KEY(feedback) REFERENCES feedback(id),
                FOREIGN KEY(user) REFERENCES users(name)
            )`);
        });
        this.db.serialize(() => {
            this.db.run('DROP TABLE IF EXISTS users');
            this.db.run(`CREATE TABLE users(
                name TEXT PRIMARY KEY
            )`);
        });
    });
}

// Database structure from the `sqlite3` package
// We attempt to open `feedback.db` in R/W mode; if the database doesn't exist, we create it first.
db = new sqlite3.Database('feedback.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        if (err.code === "SQLITE_CANTOPEN") {
            exports.db = new sqlite3.Database('feedback.db', sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    return console.error(`Could not create database: ${err.message}`);
                }

                console.log('Created the SQLite3 database.');

                // We create initial tables for the new database
                rebuildDatabase();

                return;
            });
            return;
        } else {
            return console.error(`Could not connect to database: ${err.message}`);
        }
    }

    console.log('Connected to the SQLite3 database.');
});

exports.rebuildDatabase = rebuildDatabase;
exports.db = db;

// Enumerates the different kinds of supported `status` fields for a `feedback` row.
exports.FeedbackStatus = {
    min: 0,
    max: 4,
    values: {
        None: 0,
        Open: 1,
        ClosedBacklog: 2,
        ClosedSolved: 3,
        ClosedRejected: 4
    }
};

// A `Feedback` object represents a `Feedback` row in the database.
// `parent` can be `null`, if the feedback is not a reply to another user's feedback/comment
// `score` is an integer from 1 to 5
// `status` is an integer corresponding to one of the statuses, as defined in `this.FeedbackStatus`
// `wasRoot` is `true` if the `Feedback` was previously a "root" feedback that was merged into a comment by a product manager
exports.Feedback = function(id, parent, user, statement, score, votes, status, wasRoot) {
    this.id = id;
    this.parent = parent;
    this.user = user;
    this.statement = statement;
    this.score = score;
    this.votes = votes;
    this.status = status;
    this.wasRoot = wasRoot;
};

exports.Vote = function(feedback, value, user) {
    this.feedback = feedback;
    this.value = value;
    this.user = user;
};

// Stub function — Merely adds a user to the `users` table
exports.create_user = (name, callback) => {
    this.db.run('INSERT INTO users VALUES (?)', [name], (err) => {
        callback(err ? 'Database error' : null);
    });
};

// Stub function — Adds a user to the `users` table if it doesn't exist yet
// This is absolutely not the way to authenticate a user; this is merely a stub function that would get replaced by actual code in the real world (probably integrating with an existing OAuth service)
exports.authenticate = (name, callback) => {
    this.db.serialize(() => {
        this.db.get('SELECT name FROM users WHERE name=?', [name], (err, row) => {
            if (err) {
                console.error(err);
                return callback('Database error');
            }

            row === undefined ? this.create_user(name, callback) : callback(null);
        });
    });
};

exports.get_feedback_ids = (callback) => {
    this.db.all('SELECT id FROM feedback WHERE parent IS NULL', [], (err, rows) => {
        if (err) {
            console.error(err);
            return callback('Database error', null);
        }

        let ids = [];
        rows.forEach((row) => {
            ids.push(row.id);
        });

        callback(null, ids);
    });
}

// Returns a `this.Feedback` object or an error
exports.get_feedback = (id, callback) => {
    this.db.get(`
                SELECT
                    feedback.id AS id,
                    user,
                    statement,
                    parent,
                    score,
                    IFNULL(
                        (SELECT SUM(value) FROM votes WHERE feedback=feedback.id),
                        0
                    ) AS votes,
                    status
                FROM feedback
                WHERE id=?`,
            [id], (err, row) => {
        if (err) {
            console.error(err);
            return callback('Database error', null);
        }

        if (row === undefined) {
            return callback('No such feedback', null);
        }

        if (row.parent !== null) {
            return callback('No such feedback (is a comment)', null);
        }

        callback(null, new this.Feedback(row.id, null, row.user, row.statement, row.score, row.votes, row.status, false));
    })
};

function get_comments_impl(id, callback) {
    let comments = [];

    let workers = 0;
    this.db.each(`
                SELECT
                    feedback.id AS id,
                    user,
                    statement,
                    IFNULL(
                        (SELECT SUM(value) FROM votes WHERE feedback=feedback.id),
                        0
                    ) AS votes,
                    wasRoot
                FROM feedback
                WHERE parent=?`,
            [id], (err, row) => {
        ++workers;

        if (err) {
            console.error(err);
            return callback('Database error', null);
        }

        get_comments_impl(row.id, (err, subComments) => {
            if (err) {
                return callback(err, null);
            }

            comments.push({
                id: row.id,
                user: row.user,
                statement: row.statement,
                votes: row.votes,
                wasRoot: row.wasRoot,
                comments: subComments
            });

            --workers;
        });
    }, (err, n) => {
        if (err) {
            console.error(err);
            return callback('Database error', null);
        }
        
        // The `get_comments_impl` calls are done asynchronously; therefore, this callback is called before those asynchronous calls are over. The `workers` counter keeps track of how many asynchronous calls are still running; when it reachers 0, it means all asynchronous calls are over and we can call back with a complete comment chain.
        let waitForWorkers = () => {
            if (workers === 0) {
                callback(null, comments);
            } else {
                setTimeout(waitForWorkers, 20);
            }
        };
        waitForWorkers();
    });
}

exports.get_comments = (id, callback) => {
    this.get_feedback(id, (err, feedback) => {
        if (err) {
            return callback(err, null);
        }

        let commentTree = {};

        this.db.serialize(() => {
            get_comments_impl(id, (err, comments) => {
                if (err) {
                    return callback(err, null);
                }

                commentTree.comments = comments;
                callback(null, commentTree);
            })
        });
    });
}

// Adds a `this.Feedback` object to the `feedbacks` table
exports.add_feedback = (feedback, callback) => {
    this.db.serialize(() => {
        this.db.get('SELECT COUNT(*) FROM feedback WHERE id=?', [feedback.parent], (err, row) => {
            if (err) {
                console.error(err);
                return callback('Database error');
            }

            if (row['COUNT(*)'] === 0 && feedback.parent !== null) {
                return callback('Feedback parent doesn\'t exist');
            }

            this.db.run(
                'INSERT INTO feedback(parent, user, statement, score, status, wasRoot) VALUES(?, ?, ?, ?, ?, ?)',
                [feedback.parent, feedback.user, feedback.statement, feedback.score, feedback.status, feedback.wasRoot],
                (err) => {
                    err ? callback(err.message) : callback(null);
                }
            );
        });
    });
}

// Adds a vote row. If a vote already exists for this feedback and this user, it changes the vote (no duplicates, obviously).
exports.vote = (vote, callback) => {
    this.db.serialize(() => {
        this.db.get('SELECT COUNT(*) FROM feedback WHERE id=?', [vote.feedback], (err, row) => {
            if (err) {
                console.error(err);
                return callback('Database error');
            }

            if (row['COUNT(*)'] === 0) {
                return callback('Feedback doesn\'t exist');
            }

            this.db.get('SELECT id FROM votes WHERE feedback=? AND user=?', [vote.feedback, vote.user], (err, row) => {
                if (err) {
                    console.error(err);
                    return callback('Database error');
                }

                if (row === undefined) {
                    this.db.run('INSERT INTO votes(feedback, value, user) VALUES(?, ?, ?)', [vote.feedback, vote.value, vote.user], (err) => {
                        err ? callback(err.message) : callback(null);
                    });
                } else {
                    this.db.run('UPDATE votes SET value=? WHERE id=?', [vote.value, row.id], (err) => {
                        err ? callback(err.message) : callback(null);
                    })
                }
            })
        });
    });
};

exports.merge = (orig, dest, callback) => {
    this.get_feedback(orig, (err, origFeedback) => {
        if (err) {
            return callback(err.message);
        }
        if (origFeedback.parent !== null) {
            return callback('Origin is a comment, not a feedback');
        }
        
        this.get_feedback(dest, (err, destFeedback) => {
            if (err) {
                return callback(err.message);
            }
            if (destFeedback.parent !== null) {
                return callback('Destination is a comment, not a feedback');
            }

            this.db.run('UPDATE feedback SET wasRoot=1, parent=? WHERE id=?', [dest, orig], (err) => {
                err ? callback(err.message) : callback(null);
            })
        });
    })
};

exports.setStatus = (id, status, callback) => {
    this.get_feedback(id, (err, feedback) => {
        if (err) {
            return callback(err.message);
        }
        if (feedback.parent !== null) {
            return callback(`${id} is a comment, not a feedback`);
        }
        
        this.db.run('UPDATE feedback SET status=? WHERE id=?', [status, id], (err) => {
            err ? callback(err.message) : callback(null);
        })
    })
};
