const express = require('express');
const bodyParser = require('body-parser');
const database = require('./database.js');
const request_validator = require('./request-validator.js')

const port = 8001;
const app = express();
app.use(bodyParser.json())

app.route('/rebuild-database').get((req, res) => {
    database.rebuildDatabase();
    res.send({
        'status': 'It works, baby!'
    })
});

function post_feedback(req, res) {
    // We check that the right keys exist
    if (!request_validator.validate(req.body, ['user', 'statement'])) {
        res.send(400, {
            'error': 'Missing key(s)'
        });

        return;
    }
    if (req.params['id'] === undefined && req.body['score'] === undefined) {
        res.send(400, {
            'error': 'Missing key(s)',
            'message': 'score is mandatory for user feedback'
        })

        return;
    }

    // Type checking
    if (typeof req.body.user !== 'string' || typeof req.body.statement !== 'string' || (req.params['id'] === undefined && typeof req.body.score !== 'number')) {
        res.send(400, {
            'error': 'Wrong value type(s)'
        });
        
        return;
    }

    // Value checking
    if (req.params['id'] === undefined && (Math.floor(req.body.score) !== req.body.score || req.body.score < 1 || req.body.score > 5)) {
        res.send(400, {
            'error': 'Invalid score'
        });

        return;
    }

    // Stub authentication (see database.js: this is not actual authentication)
    database.authenticate(req.body.user, (err) => {
        if (err !== null) {
            res.send(400, {
                'error': 'Could not authenticate',
                'message': err
            });
        } else {
            database.add_feedback(new database.Feedback(req.params['id'] === undefined ? null : parseInt(req.params['id']), req.body.user, req.body.statement, req.params['id'] === undefined ? req.body.score : null, database.FeedbackStatus.None, false), (err) => {
                if (err !== null) {
                    res.send(500, {
                        'error': 'Could not post feedback',
                        'message': err
                    })
                } else {
                    res.send(201, {
                        'success': 'Success!'
                    });
                }
            });
        }
    });
}

app.route('/feedback/post').post(post_feedback);
app.route('/feedback/:id/post').post(post_feedback);

app.route('/feedback/:id').get((req, res) => {
    database.get_feedback(req.params['id'], (err, feedback) => {
        if (err) {
            res.send(400, {
                'error': 'Could not get feedback',
                'message': err
            });
        } else {
            database.get_votes(req.params['id'], (err, votes) => {
                if (err) {
                    res.send(500, {
                        'error': 'Could not get votes',
                        'message': err
                    });
                } else {
                    res.send(200, {
                        user: feedback.user,
                        statement: feedback.statement,
                        score: feedback.score,
                        status: feedback.status,
                        votes: votes
                    });
                }
            });
        }
    });
});

app.route('/feedback/:id/comments').get((req, res) => {
    database.get_comments(req.params['id'], (err, comments) => {
        if (err) {
            res.send(400, {
                'error': 'Could not get comments',
                'message': err
            });
        } else {
            res.send(200, comments);
        }
    });
});

app.route('/feedback/:id/vote').post((req, res) => {
    // We check that the right keys exist
    if (!request_validator.validate(req.body, ['user', 'vote'])) {
        res.send(400, {
            'error': 'Missing key(s)'
        });

        return;
    }

    // Type checking
    if (typeof req.body.user !== 'string' || typeof req.body.vote !== 'number') {
        res.send(400, {
            'error': 'Wrong value type(s)'
        });
        
        return;
    }

    // Value checking
    if (Math.floor(req.body.vote) !== req.body.vote || (req.body.vote !== -1 && req.body.vote !== 0 && req.body.vote !== +1)) {
        res.send(400, {
            'error': 'Invalid vote'
        });

        return;
    }

    // Stub authentication (see database.js: this is not actual authentication)
    database.authenticate(req.body.user, (err) => {
        if (err !== null) {
            res.send(400, {
                'error': 'Could not authenticate',
                'message': err
            });
        } else {
            database.vote(new database.Vote(req.params['id'], req.body.vote, req.body.user), (err) => {
                if (err !== null) {
                    res.send(500, {
                        'error': 'Could not vote',
                        'message': err
                    })
                } else {
                    res.send(201, {
                        'success': 'Success!'
                    });
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server started! Listening on port ${port}`)
});
