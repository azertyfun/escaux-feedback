## Documentation

All endpoints will return the following struct if an error was encountered:
```JSON
{
    "error": "Error message",
    "message": "Further clarification (optional)"
}
```

### GET `/rebuild-database`

Rebuilds the database by nuking it and re-creating the relevant tables. This is a debug feature that, of course, would not be present in a finalized product (either by deactivating it in prod, or outright stripping it from the code).

```JSON
{
    "status": "Database rebuilt successfully!"
}
```

### POST `/feedback/post`

Post new feedback to the site.

POST data:

```JSON
{
    "user": "<username>", // This is not checked for the minimum viable product, but would be replaced by an actual auth system such as OAuth in a real product
    "statement": "<statement>",
    "score": 5, // 1-5 inclusive
}
```

Output:

```JSON
{
    "success": "Success!"
}
```

### POST `/feedback/<id>/post`

Post a comment to another comment or feedback (comments and feedbacks share the same ID space)

POST data:

```JSON
{
    "user": "<username>", // This is not checked for the minimum viable product, but would be replaced by an actual auth system such as OAuth in a real product
    "statement": "<statement>"
}
```

Output:

```JSON
{
    "success": "Success!"
}
```

### GET `/feedback`

Returns a list of all the "root" feedbacks

Output:

```JSON
{
    "feedback": [
        {
            "id": 1,
            "user": "<user>",
            "statement": "<Statement>",
            "score": 3, // User score, 1-5 inclusive
            "status": 1, // See "Status"
            "votes": 5 // Total score from votes
        },
        {
            "id": 2,
            "user": "<user>",
            "statement": "<Statement>",
            "score": 3, // User score, 1-5 inclusive
            "status": 1, // See "Status"
            "votes": 1 // Total score from votes
        }
    ]
}
```

### Status

Feedback elements have a `status` fields, defined as such:
```JSON
{
    "None": 0,
    "Open": 1,
    "ClosedBacklog": 2,
    "ClosedSolved": 3,
    "ClosedRejected": 4
}
```

### GET `/feedback/<id>`

Returns a single feedback element

Output:

```JSON
{
    "id": 1,
    "user": "<user>",
    "statement": "<Statement>",
    "score": 3, // User score, 1-5 inclusive
    "status": 1, // See "Status"
    "votes": 5 // Total score from votes
}
```

### GET `/feedback/<id>/comments`

Returns the comment chain for a feedback element

Output:

```JSON
{
    "comments": [
        {
            "id": 4,
            "user": "<username>",
            "statement": "<Statement>",
            "votes": -4,
            "wasRoot": 0, // set to 1 (true) if the comment was previously a root feedback element that was merged into the parent feedback element by a content operator. Otherwise behaves like any other comment.
            "comments": []
        },
        {
            "id": 2,
            "user": "<usrname>",
            "statement": "<Statement>",
            "votes": 2,
            "wasRoot": 0,
            "comments": [
                {
                    "id": 2,
                    "user": "<usrname>",
                    "statement": "<Statement>",
                    "votes": 2,
                    "wasRoot": 0,
                    "comments": []
                }
            ]
        }
    ]
}
```

### POST `/feedback/<id>/vote`

Casts a vote for a comment or feedback element (they share the same ID space).

POST data:

```JSON
{
    "user": "<username>", // This is not checked for the minimum viable product, but would be replaced by an actual auth system such as OAuth in a real product
    "vote": 0 // -1, 0 or 1
}
```

Output:

```JSON
{
    "success": "Success!"
}
```

### POST `/feedback/<orig>/merge/<dest>`

Merges the feedback element with id `<orig>` into the feedback element with id `<dest>`. `<orig>` will be a comment of `<dest>`, with only `wasRoot: 1` to set it apart. The comment chain will be moved as well.

POST data:

```JSON
{
    "user": "<username>" // This is not checked for the minimum viable product, but would be replaced by an actual auth system such as OAuth in a real product
}
```

Output:

```JSON
{
    "success": "Success!"
}
```

### POST `/feedback/<id>/status`

Changes the status of a feedback element. See "status" for more information.

POST data:

```JSON
{
    "user": "<username>", // This is not checked for the minimum viable product, but would be replaced by an actual auth system such as OAuth in a real product
    "status": 0
}
```

Output:

```JSON
{
    "success": "Success!"
}
```

