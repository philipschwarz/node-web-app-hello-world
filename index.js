const express = require('express');
const pg = require('pg');
const amqp = require('amqplib/callback_api');

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

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser());

app.listen(3000);

// Use Cases ////////////////////////////////////////////

app.get("/messages", function (request, response) {
  displayMessagesSentSoFar(response);
});

app.get('/message', function(request, response){
  displayFormForSendingMessage(response);
});

app.post('/message', function(request, response){
  var userName = request.body.userName;
  var messageToSend = request.body.message;
  persistMessageAndReportSuccess(userName, messageToSend, response);
});

// Use Case Handling ///////////////////////////////////

function displayMessagesSentSoFar(response){
  var query = 'SELECT * FROM message;';
  var queryParameters = [];
  var queryResultProcessor = function(queryResult){ response.send(queryResult.rows); };
  runQuery(query, queryParameters, queryResultProcessor);
};

function  displayFormForSendingMessage(response) {
  // The form's action is '/' and its method is 'POST',
  // so the `app.post('/', ...` route will receive the
  // result of our form
  console.log('in here');
  var html = '<form action="/message" method="post">' +
    'Username:' +
    '<input type="text" name="userName" placeholder="..." />' +
    '<br>' +
    'Message:' +
    '<input type="text" name="message" placeholder="..." />' +
    '<br>' +
    '<button type="submit">Submit</button>' +
    '</form>';

  response.send(html);
};

function persistMessageAndReportSuccess(userName, messageToSend, response) {
  var successReport = createReportTellingUserTheyHaveSentMessage(userName, messageToSend);
  var query = 'INSERT INTO message (USERNAME, MESSAGE) VALUES ($1,$2) RETURNING id;';
  var queryParameters = [userName, messageToSend];
  var queryResultProcessor = function (queryResult) {
    createMessageEvent(queryResult, userName, messageToSend);
    response.send(successReport);
  };
  runQuery(query, queryParameters, queryResultProcessor);
};

function createReportTellingUserTheyHaveSentMessage(userName, message) {
  return userName + ": you have just sent message '" + message + "'.<br>"
    + '<a href="/message">Send another</a>';
};

// DB CONNECTION POOL ////////////////////////////////////////////////

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

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
});

// DB QUERIES /////////////////////////////////////////////////

function runQuery(query, parameters, processResult) {
  console.log("about to try connecting to DB");
  // to run a query we can acquire a client from the pool,
  // run a query on the client, and then return the client to the pool
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query(query, parameters, function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        return console.error('error running query', err);
      }
      processResult(result);
    });
  });
};

// MESSAGING /////////////////////////////////

function getAmpqServerUrl()
{
  const host = process.env.RABBITMQ_PORT_5672_TCP_ADDR;
  const url = 'amqp://' + host;
  return url;
}

const AMPQ_SERVER = getAmpqServerUrl();

function createMessageEvent(queryResult, userName, messageToSend){
  console.log("queryResult=" + JSON.stringify(queryResult));
  messageId = queryResult.rows[0].id;

  amqp.connect(AMPQ_SERVER, function(error, connection)
  {
    connection.createChannel( function(error, channel)
    {
      var queueName = 'message-event';

      channel.assertQueue(queueName, {durable: false});

      channel.sendToQueue(queueName, new Buffer(messageId.toString()));

      console.log("Sent message id " + messageId + "to queue " + queueName + ".");

    });

    setTimeout(function() { connection.close(); process.exit(0) }, 500);

  });

}
