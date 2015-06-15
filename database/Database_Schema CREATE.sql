/* CREATE DATABASE iob; */

/* CREATE EXTENSION postgis; */

CREATE TABLE IF NOT EXISTS devices (
	device_id varchar(20) PRIMARY KEY,
	theft_protection_active boolean NOT NULL
);

CREATE TABLE geofences (
	geofence_id SERIAL PRIMARY KEY,
	device_id varchar(20) NOT NULL REFERENCES devices(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
	area geometry
);

CREATE TABLE messages (
	message_id SERIAL PRIMARY KEY,
	device_id varchar(20) NOT NULL REFERENCES devices(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
	loc geometry,
	"time" timestamp without time zone,
	"data" varchar(20) NOT NULL
);

CREATE TABLE iobdata (
    id SERIAL PRIMARY KEY,
    ip text,
    data jsonb
);