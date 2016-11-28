const express = require('express');
const pg = require('pg');
/*
 * body-parser is a piece of express middleware that
 *   reads a form's input and stores it as a javascript
 *   object accessible through `req.body`
 *
 * 'body-parser' must be installed (via `npm install --save body-parser`)
 * For more info see: https://github.com/expressjs/body-parser
 */
var bodyParser = require('body-parser');

const app = express();

const articles = [{ title: 'Example' }];
// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser());

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
  host: 'postgres',
  user: 'postgres', //env var: PGUSER
  database: 'postgres', //env var: PGDATABASE
  password: 'pwd', //env var: PGPASSWORD
  port: 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};


//this initializes a connection pool
//it will keep idle connections open for a 30 seconds
//and set a limit of maximum 10 idle clients
var pool = new pg.Pool(config);

app.get("/messages", function (req, res) {
  console.log("about to try connecting to DB");
  // to run a query we can acquire a client from the pool,
  // run a query on the client, and then return the client to the pool
    pool.connect(function(err, client, done) {
      if(err) {
        return console.error('error fetching client from pool', err);
      }
      client.query('SELECT * FROM message;', [], function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if(err) {
          return console.error('error running query', err);
        }
        res.send(result.rows);
      });
    });
});

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
})

app.get('/', function(req, res){
  // The form's action is '/' and its method is 'POST',
  // so the `app.post('/', ...` route will receive the
  // result of our form
  console.log('in here');
  var html = '<form action="/" method="post">' +
    'Username:' +
    '<input type="text" name="userName" placeholder="..." />' +
    '<br>' +
    'Message:' +
    '<input type="text" name="message" placeholder="..." />' +
    '<br>' +
    '<button type="submit">Submit</button>' +
    '</form>';

  res.send(html);
});

// curl -X POST http://localhost:3000/articles
// This route receives the posted form.
// As explained above, usage of 'body-parser' means
// that `req.body` will be filled in with the form elements
app.post('/', function(req, res){
  var userName = req.body.userName;
  var message = req.body.message;
  var html =
    userName + ": you have just sent message '" + message + "'.<br>" +
    '<a href="/">Send another</a>';
  res.send(html);
});

app.listen(3000);