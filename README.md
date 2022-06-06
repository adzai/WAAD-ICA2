# WAAD-ICA2

Deployed on https://poll-app-pcu.herokuapp.com


## Install and run
Make sure to run the db-install.sql script like so:
`mysql -h <hostname> -u <username> -p < db-install.sql`

**Env variables**

```
DB_HOST="hostname"
DB_USER="username"
DB_PASS="password"
DB_NAME="dbname"
SESS_NAME="sessionname"
SESS_SECRET="secret"
PORT=portnum
```


Install npm packages, build svelte app and start node:
`npm run build && npm start`

## Description
The app allows a user to create a question with 2-6 answers.
Other users can then vote on it and after voting a vote
statistic can be shown to the user.
The users are tracked via sessions. A question can be
deleted only by the user that created it and a given user
can only vote once on a question.

