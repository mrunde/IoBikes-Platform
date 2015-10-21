var pg = require('pg');
var conString = process.env.DATABASE_URL || 'postgres://username:password@localhost/iob';

var client = new pg.Client(conString);
//client.connect();
