/******************************************************************************
		Node Webserver for the "Internet of Bicycles"-Platform
*******************************************************************************
Table of Content

1. Basic Server Setup
2. Routes for API
	2.1 Messages
	2.2 Geofences
	2.3 Devices
*******************************************************************************/

/****************************
	1. Basic Server Setup
****************************/

// Load packages
var express = require('express');         // call express framework
var app = express();                      // define our app using express
var bodyParser = require('body-parser');  // important package for post method
var multer = require('multer'); 

// Database connection
var pg = require('pg'); // call PostgreSQL client (https://github.com/brianc/node-postgres)
// change username and password before starting the server 
var conString = process.env.DATABASE_URL || 'postgres://USERNAME:PASSWORD@giv-iob.uni-muenster.de/iob';
//var db_model = require('./app/models/database');

// Public folder to upload media, etc. (not required yet)
app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

// Configure app to use bodyParser() - this will let us get the data from a POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer()); // for parsing multipart/form-data

var port = process.env.PORT || 80;      // set our port, change before roll-out

//var http = require('http');

/****************************
	2. Routes for API
****************************/

var router = express.Router(); // get an instance of the express router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging of request
    console.log('There was an API request.');
    next(); // make sure we go to the next routes and don't stop here
});

// error handler
var handleError = function(err) {
      // no error occurred, continue with the request
      if(!err) return false;
      // an error occurred, remove the client from the connection pool
      done(client);
      res.writeHead(500, {'content-type': 'text/plain'});
      res.end('An error occurred');
	  console.log(err);
      return true;
};
	
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'Welcome to our IoB API!' });
});

/* try with DB model -- not working because tutorial was for mongoDB
router.route('/messages')
    // get all the messages (accessed at GET http://localhost:8080/api/messages)
    .get(function(req, res) {
        Messages.find(function(err, messages) {
            if (err)
                res.send(err);
            res.json(messages);
        });
    });
*/

/***************
2.1 Messages
****************/

// GET all messages (not needed now): SELECT * FROM messages ORDER BY message_id ASC;

// GET all messages from a specific device
router.get('/messages/:device_id', function(req, res) {

    var results = [];
	var deviceId = req.params.device_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var query = client.query({
			text: 'SELECT * FROM messages WHERE device_id = $1 ORDER BY message_id ASC', 
			values: [deviceId]
		});

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// POST one message (Error: Insert or Update table 'messages' hurts Foreignkey-Constraint 'messages_device_id_fkey)
router.post('/messages', function(req, res) {

	// grab data from http request
	var data = {dev_id: req.body.device_id, lon: req.body.lon, lat: req.body.lat, time: req.body.time};
	
	//console.log("Device ID = " + data.dev_id);
	//console.log("Longitude = " + data.lon);
	//console.log("Latitude = " + data.lat);
	//console.log("Time = " + data.time);
	
    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {
		
        // SQL Query - insert data
        var query = client.query({
			text: 'INSERT INTO messages(device_id, lon, lat, time) VALUES ($1,$2,$3,$4)',
			values: [data.dev_id, data.lon, data.lat, data.time]
		});
        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'POST was successful!', device: data.dev_id});
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// GET one message
router.get('/messages/:message_id', function(req, res) {

    var results = [];
	var messageId = req.params.message_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var query = client.query('SELECT * FROM messages WHERE message_id = ($1)', [messageId]);

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// DELETE one message
router.delete('/messages/:message_id', function(req, res) {

	var messageId = req.params.message_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - delete data
        var query = client.query('DELETE FROM messages WHERE message_id = ($1)', [messageId]);

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'DELETE was successful!', id: messageId})
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

/***************
2.2 Geofences
****************/
// POST a geofence
router.post('/geofences', function(req, res) {

    // grab data from http request
    var data = {dev_id: req.body.device_id, lon: req.body.lon, lat: req.body.lat, radius: req.body.radius}

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - insert data
        var query = client.query({
            text: 'INSERT INTO geofences(device_id, lon, lat, radius) VALUES ($1, $2, $3, $4)',
            values: [data.dev_id, data.lon, data.lat, data.radius]
        });
        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'POST was successful!', device: data.dev_id})
        });

        // handle errors
        if(err) {
            console.log(err);
            res.json({ message: 'Error!' });
        }
    });
});

// GET all geofences from a specific device
/* WIP
router.get('/geofences/device/:id', function(req, res) {

    var results = [];
    var deviceId = req.params.id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var query = client.query({
            text: 'SELECT * FROM geofences WHERE device_id = $1 ORDER BY geofence_id ASC', 
            values: [deviceId]
        });

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // handle errors
        if(err) {
          console.log(err);
          res.json({ message: 'Error!' });
        }

    });
});
*/

// GET one geofence
/* WIP
router.get('/geofences/:id', function(req, res) {

    var results = [];
    var geofenceId = req.params.id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var query = client.query('SELECT * FROM geofences WHERE geofence_id = ($1)', [geofenceId]);

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // handle errors
        if(err) {
          console.log(err);
          res.json({ message: 'Error!' });
        }

    });
});
*/

// DELETE one geofence
/* WIP
router.delete('/geofences/:id', function(req, res) {

    var geofenceId = req.params.id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - delete data
        var query = client.query('DELETE FROM geofences WHERE geofence_id = ($1)', [geofenceId]);

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'DELETE was successful!', id: geofenceId})
        });

        // handle errors
        if(err) {
          console.log(err);
          res.json({ message: 'Error!' });
        }

    });
});
*/

// GET boolean message in geofence
router.get('/:geofence_id/:message_id', function(req, res) {

    var result;
    var messageLat;
    var messageLon;
    var geofenceId = req.params.geofence_id;
    var messageId = req.params.message_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var queryData = client.query('SELECT * FROM messages WHERE message_id = ($1)', [messageId]);

        // stream results back one row at a time
        queryData.on('row', function(row) {
            messageLat = row.lat;
            messageLon = row.lon;
        });

        // SQL Query - select function
        var queryFunction = client.query('SELECT point_in_geofence($1, $2, $3)', [geofenceId, messageLon, messageLat]);

        // stream results back one row at a time
        queryFunction.on('row', function(row) {
            result = row.point_in_geofence;
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ pointInPolygon: result });
        });

        // handle errors
        if(err) {
          console.log(err);
          res.json({ message: 'Error!' });
        }

    });
});

/***************
2.3 Devices
****************/
// POST a device with status
router.post('/devices', function(req, res) {

	// grab data from http request
	var data = {dev_id: req.body.device_id, status: req.body.theft_protection}

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - insert data
        var query = client.query({
			text: 'INSERT INTO devices(device_id, theft_protection_active) VALUES ($1,$2)',
			values: [data.dev_id, data.status]
		});
        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'POST was successful!', device: data.dev_id})
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// GET status of one device
router.get('/devices/:device_id', function(req, res) {

    var results = [];
	var deviceId = req.params.device_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var query = client.query('SELECT theft_protection_active FROM devices WHERE device_id = ($1)', [deviceId]);

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json(results);
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// PUT status of one device (update)
router.put('/devices/:device_id', function(req, res) {

    var results = [];
	var deviceId = req.params.device_id;
	var data = {dev_id: req.body.device_id, status: req.body.theft_protection_active};
	
    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - update data
        var query = client.query({
			text: 'UPDATE devices SET theft_protection_active=($1) WHERE device_id=($2)',
			values: [data.status, deviceId]
		});

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'UPDATE was successful!', device: deviceId, theft_protection_active: data.status});
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// DELETE one device
router.delete('/devices/:device_id', function(req, res) {

	var deviceId = req.params.device_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - delete data
        var query = client.query('DELETE FROM devices WHERE device_id = ($1)', [deviceId]);

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'DELETE was successful!', id: deviceId})
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
