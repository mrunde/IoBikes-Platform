/******************************************************************************
		Node Webserver for the "Internet of Bicycles"-Platform
*******************************************************************************
Table of Content

1. Basic Server Setup
2. Routes for API (Source: http://mherman.org/blog/2015/02/12/postgresql-and-nodejs)
	2.1 Messages
	2.2 Geofences
	2.3 Devices
	2.4 Testing
*******************************************************************************/

/****************************
	1. Basic Server Setup
****************************/

// Load packages
var express = require('express');         // call express framework
var app = express();                      // define our app using express
var bodyParser = require('body-parser');  // important package for post method
var multer = require('multer'); 		  // middleware for handling multipart/form-data
var util = require('util');				  // for logging and debugging
var GeoJSON = require('geojson');		  // convert an array of geographic objects to GeoJSON
	
// Database connection
var pg = require('pg'); // call PostgreSQL client (https://github.com/brianc/node-postgres)
// replace USERNAME and PASSWORD before starting the server 
var conString = process.env.DATABASE_URL || 'postgres://USERNAME:PASSWORD@giv-iob.uni-muenster.de/iob';

// Public folder to upload media, etc. (not required yet)
app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

// Configure app to use bodyParser() - this will let us get the data from a POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer()); // for parsing multipart/form-data

var port = process.env.PORT || 80;      // set our port, change before roll-out, remove '|| 80' when using iisnode

/****************************
	2. Routes for API
****************************/

var router = express.Router(); // get an instance of the express router

// middleware to use for all requests
router.use(function(req, res, next) {
    // log each request to the console
    console.log(req.method, req.url);
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
    res.send('Welcome to our IoB API!');
});

/***************
2.1 Messages
****************/

// GET all messages (not needed now): SELECT * FROM messages ORDER BY message_id ASC;

// GET all messages from a specific device
router.get('/messages/device/:id', function(req, res) {

    var results = [];
	var deviceId = req.params.id;

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
	var data = {dev_id: req.body.device_id, lon: req.body.lon, lat: req.body.lat, time: req.body.time, temp: req.body.temp};
	
    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {
		
        // SQL Query - insert data
        var query = client.query({
			text: 'INSERT INTO messages(device_id, lon, lat, time, temp) VALUES ($1,$2,$3,$4,$5)',
			values: [data.dev_id, data.lon, data.lat, data.time, data.temp]
		});
        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'POST was successful!', device: data.dev_id, latitude: data.lat, longitude: data.lon, time: data.time, temperature: data.temp});
        });

        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
});

// GET one message
router.get('/messages/:id', function(req, res) {

    var results = [];
	var messageId = req.params.id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
		var query = client.query({
			text: 'SELECT * FROM messages WHERE message_id = $1', 
			values: [messageId]
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

// DELETE one message
router.delete('/messages/:id', function(req, res) {

	var messageId = req.params.id;

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
            return res.json({ message: 'POST was successful!', device: data.dev_id, latitude: data.lat, longitude: data.lon, radius: data.radius})
        });

        // handle errors
        if(err) {
            console.log(err);
            res.json({ message: 'Error!' });
        }
    });
});

// GET all geofences from a specific device
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

// GET one geofence
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

// PUT one geofence (update)
router.put('/geofences/:id', function(req, res) {

    var results = [];
    var geofenceId = req.params.id;
    var data = {lon: req.body.lon, lat: req.body.lat, radius: req.body.radius};
    
    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - update data
        var query = client.query({
            text: 'UPDATE geofences SET lon=($2), lat=($3), radius=($4) WHERE geofence_id=($1)',
            values: [geofenceId, data.lon, data.lat, data.radius]
        });

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
            return res.json({ message: 'UPDATE was successful!', geofence: geofenceId, latitude: data.lat, longitude: data.lon, radius: data.radius});
        });

        // handle errors
        if(err) {
          console.log(err);
          res.json({ message: 'Error!' });
        }

    });
});

// DELETE one geofence
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

// GET boolean message in geofence
router.get('/geofences/:geofence_id/:message_id', function(req, res) {

    var result;
    var messageLat;
    var messageLon;
    var geofenceId = req.params.geofence_id;
    var messageId = req.params.message_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select latitude and longitude of message
		client.query('SELECT lon, lat FROM messages WHERE message_id = ($1)', [messageId], function(err, result) {
			
			//call done() to release the client back to the pool
			done();
	  
			messageLat = result.rows[0].lat;
			messageLon = result.rows[0].lon;
				
			//console.log("Latitude = " + messageLat);
			//console.log("Longitude = " + messageLon);	

			// SQL Query - select function
			var queryFunction = client.query('SELECT point_in_geofence($1, $2, $3)', [geofenceId, messageLon, messageLat]);
			// log query
			console.log(util.inspect(queryFunction, {showHidden: false, depth: null}));
			
			// stream results back one row at a time
			queryFunction.on('row', function(row) {
				result = row.point_in_geofence;
				console.log("Point in Geofence? " + result);
			});

			// after all data is returned, close connection and return results
			queryFunction.on('end', function() {
				client.end();
				return res.json({ pointInPolygon: result });
			});
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
            return res.json({ message: 'POST was successful!', device: data.dev_id, theft_protection_active: data.status})
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

/***************
2.4 Testing
****************/
// GET all messages with coordinates sent from a real device to get a GeoJSON and display the locations on a map
router.get('/test/:device_id', function(req, res) {

	var results = [];
	var deviceId = req.params.device_id;

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

        // SQL Query - select data
        var query = client.query({
			text: 'SELECT * FROM messages WHERE device_id = $1 AND lat IS NOT NULL AND lon IS NOT NULL ORDER BY message_id DESC', 
			values: [deviceId]
		});

        // stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // after all data is returned, close connection and return results
        query.on('end', function() {
            client.end();
			var geo = GeoJSON.parse(results, {Point: ['lat', 'lon']});
			//console.log(geo);
			return res.json(geo);
        });
		
        // handle errors
        if(err) {
          console.log(err);
		  res.json({ message: 'Error!' });
        }

    });
	
});

// GET technical information of device measurements (signal strength etc.) - IRRELEVANT
router.get('/test/signal', function(req, res) {

	var results = [];

    // get a postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {

		// iob data query
	    var query = client.query('SELECT data FROM iobdata WHERE id >= 156 ORDER BY id DESC'); 

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
		
		

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router); // when using iisnode use '/node/api' instead

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
