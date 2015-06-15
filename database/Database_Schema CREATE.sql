/* CREATE DATABASE iob; */

/* CREATE EXTENSION postgis; */

DROP TABLE IF EXISTS devices CASCADE;
CREATE TABLE IF NOT EXISTS devices (
	device_id varchar(20) PRIMARY KEY,
	theft_protection_active boolean NOT NULL
);

DROP TABLE IF EXISTS geofences CASCADE;
CREATE TABLE geofences (
	geofence_id SERIAL PRIMARY KEY,
	device_id varchar(20) NOT NULL REFERENCES devices(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
	area geometry
);

DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
	message_id SERIAL PRIMARY KEY,
	device_id varchar(20) NOT NULL REFERENCES devices(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
	lon DOUBLE PRECISION,
	lat DOUBLE PRECISION,
	"time" timestamp without time zone
);

DROP TABLE IF EXISTS iobdata CASCADE;
CREATE TABLE iobdata (
    id SERIAL PRIMARY KEY,
    ip text,
    data jsonb
);