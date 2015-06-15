
-- function to create get all the information for a measurement
DROP FUNCTION IF EXISTS getMessagesInformation() CASCADE;
CREATE FUNCTION getMessagesInformation() RETURNS TRIGGER AS
$BODY$
    DECLARE
	complete_data_string text; -- a row in loop
	newest integer;
	pos_start_data integer; -- the position where the data string starts
	data_sub varchar(20); -- the hex encoded data string sent from the device
	pos_start_lon integer; -- the position where the lon string starts
	lon double precision; -- the lon string from the device
	pos_start_lat integer; -- the position where the lat string starts
	lat double precision; -- the lat string from the device
	pos_start_time integer; -- the position where the data string starts
	time_sub text; -- the time string from the device
	theft_protection boolean; -- indicating if theft protection is on / off
	pos_start_id integer; -- the position where the device id starts
	dev_id varchar(20); -- device ID

	point_str text; -- string to create point
        loc point; -- location point resulting from lon / lat
        t timestamp;
    BEGIN  
	RAISE INFO 'BEGIN getMessagesInformation';
        -- get data from newest entry
	SELECT max(id) FROM iobdata into newest;
	RAISE INFO 'newest: %', newest;
        SELECT data FROM iobdata where id = newest into complete_data_string;
	RAISE INFO 'DATA: %', complete_data_string;
	-- data sub
	select position('"data": "' in complete_data_string) into pos_start_data;
	RAISE INFO 'pos_start_data: %', pos_start_data;
	SELECT substring(complete_data_string from (pos_start_data+9) for 18) into data_sub;
	RAISE INFO 'data_sub: %', data_sub;
	RAISE INFO 'theft_str: %', substring(data_sub from 1 for 2);
	-- theft_protection
	IF(substring(data_sub from 1 for 2) = '00') THEN
		SELECT FALSE into theft_protection;
	ELSE
		SELECT TRUE into theft_protection;
	END IF;
	RAISE INFO 'theft_protection: %', theft_protection;
	-- time sub
	SELECT position('"time": "' in complete_data_string) into pos_start_time;
	RAISE INFO 'pos_start_time: %', pos_start_time;
	SELECT substring(complete_data_string from (pos_start_time+9) for 10) into time_sub;
	RAISE INFO 'time_sub: %', time_sub;
	SELECT to_timestamp(cast(time_sub as double precision)) into t;
	RAISE INFO 't (timestamp): %', t;
	-- lon
	SELECT position('"lon_decimal":' in complete_data_string) into pos_start_lon;
	SELECT substring(complete_data_string from (pos_start_lon+16) for 14)::double precision into lon;
	RAISE INFO 'lon: %', lon;
	-- lat
	SELECT position('"lat_decimal":' in complete_data_string) into pos_start_lat;
	SELECT substring(complete_data_string from (pos_start_lat+16) for 15)::double precision into lat;
	RAISE INFO 'lat: %', lat;
	-- device id
	select position('"id": "' in complete_data_string) into pos_start_id;
	RAISE INFO 'pos_start_id: %', pos_start_id;
	SELECT substring(complete_data_string from (pos_start_id+7) for 5) into dev_id;
	RAISE INFO 'device id: %', dev_id;

	-- add data to devices
	if ((select count(device_id) from devices where device_id = dev_id) = 0) THEN
		INSERT INTO devices VALUES (dev_id, theft_protection);
		RAISE INFO 'Data added to devices table!';
	END IF;
	
	-- add data to message
	--INSERT INTO messages VALUES (newest, dev_id, ST_MakePoint(lon, lat), t, data_sub); -- point version
	INSERT INTO messages VALUES (newest, dev_id, lon, lat, t); -- lon, lat version
	RAISE INFO 'Data added to messages table!';
	
	-- add data to 
	RETURN NULL; -- result is ignored since this is an AFTER trigger
    END;
$BODY$
LANGUAGE plpgsql;

-- Finally add the Trigger
CREATE TRIGGER iob_trigger AFTER INSERT ON iobdata EXECUTE PROCEDURE getMessagesInformation();
