<?php
include('insert/config.php');
header('Content-Type: application/json');

// logging creates a file with some information in the end
$log = true;
// the echo documents all steps of the script
$echo = false;

// ignore iobdata table (no data will be added to iobdata) - can be enabled if it is not needed any more
$ignore_iobdata = false;

// logger to document all steps of the script (just enabled if $log is true)
$logger = '';

// connection string
$conn_string = 'host=giv-iob.uni-muenster.de port=5432 dbname=iob user=' . $user . ' password=' . $pass;
if($log){
	$logger = $logger . 'conn_string: ' . $conn_string . "\n";
}
if($echo){
	echo 'conn_string: ' . $conn_string . "\n";
}

// connection
$pgsql_conn = pg_connect($conn_string);
if ($pgsql_conn) {
	if($log){
		$logger = $logger . "Successfully connected to: " . pg_host($pgsql_conn) . "\n";
	}
	if($echo){
		echo "Successfully connected to: " . pg_host($pgsql_conn) . "\n";
	}
} else {
    print pg_last_error($pgsql_conn);
    exit;
}

// device id
$device_id = ($_GET["id"]);
if($log){
	$logger = $logger . 'device_id: ' . $device_id . "\n";
}
if($echo){
	echo 'device_id: ' . $device_id . "\n";
}

// data_string
$data_string = ($_GET["data"]);
if($log){
	$logger = $logger . 'data_string: ' . $data_string . "\n";
}
if($echo){
	echo 'data_string: ' . $data_string . "\n";
}

// theft protection
$theft_protection = 'FALSE';
if(substr($data_string, 0, 2) == '01'){
	$theft_protection = 'TRUE';
}
if($log){
	$logger = $logger . 'theft_protection: ' . $theft_protection . "\n";
}
if($echo){
	echo 'theft_protection: ' . $theft_protection . "\n";
}

// time
$time = ($_GET["time"]);
if($log){
	$logger = $logger . 'time: ' . $time . "\n";
}
if($echo){
	echo 'time: ' . $time . "\n";
}

// parse time to timestamp
$timestamp = gmdate("Y-m-d\TH:i:s\Z", $time);
if($log){
	$logger = $logger . 'timestamp: ' . $timestamp . "\n";
}
if($echo){
	echo 'timestamp: ' . $timestamp . "\n";
}

// temperature
$temperature_hex = substr(substr($data_string, -4), -2) . substr(substr($data_string, -4), 0, 2);
if($log){
	$logger = $logger . 'temperature_hex: ' . $temperature_hex . "\n";
}
if($echo){
	echo 'temperature_hex: ' . $temperature_hex . "\n";
}

// temperature in integer
$temperature_integer = hexdec($temperature_hex);
if($log){
	$logger = $logger . 'temperature_integer: ' . $temperature_integer . "\n"; 
}
if($echo){
	echo 'temperature_integer: ' . $temperature_integer . "\n"; 
}

// lon
$lon_hex = substr($data_string, 16, 2) . substr($data_string, 14, 2) . substr($data_string, 12, 2) . substr($data_string, 10, 2);
if($log){
	$logger = $logger . 'lon_hex: ' . $lon_hex . "\n";
}
if($echo){
	echo 'lon_hex: ' . $lon_hex . "\n";
}

// lat
$lat_hex = substr($data_string, 8, 2) . substr($data_string, 6, 2) . substr($data_string, 4, 2) . substr($data_string, 2, 2);
if($log){
	$logger = $logger . 'lat_hex: ' . $lat_hex . "\n";
}
if($echo){
	echo 'lat_hex: ' . $lat_hex . "\n";
}

// found parser on http://php.net/manual/de/language.types.float.php (12.06.15)
function hexTo32Float($strHex) {
    $v = hexdec($strHex);
    $x = ($v & ((1 << 23) - 1)) + (1 << 23) * ($v >> 31 | 1);
    $exp = ($v >> 23 & 0xFF) - 127;
    return round(($x * pow(2, $exp - 23)), 12);
}

// convert hex to float
if($log){
	$logger = $logger . 'Try to convert from hex to float: ' . "\n";
}

// lon in decimal
$lon_decimal = hexTo32Float($lon_hex);
if($log){
	$logger = $logger . 'lon_decimal: ' . $lon_decimal . "\n";
}
if($echo){
	echo 'lon_decimal: ' . $lon_decimal . "\n";
}

// lat in decimal
$lat_decimal = hexTo32Float($lat_hex);
if($log){
	$logger = $logger . 'lat_decimal: ' . $lat_decimal . "\n"; 
}
if($echo){
	echo 'lat_decimal: ' . $lat_decimal . "\n"; 
}

// just needed as long as device group wants to check their messages
if (!$ignore_iobdata) {
	// get complete data as json
	$data = json_encode($_GET);

	// get ip of device
	$ip = $_SERVER['REMOTE_ADDR'];
	if($log){
		$logger = $logger . 'IP of sending device is: ' . $ip . "\n";
	}
	if($echo){
		echo 'IP of sending device is: ' . $ip . "\n";
	}
	
	// append new lon & lat & temperature  to $data
	$str_to_replace = '"data":';
	$replace_data_str = '"lon_decimal":"' . $lon_decimal . '","lat_decimal":"' . $lat_decimal . '","temperature_integer":"' . $temperature_integer . '","data":';
	$extended_data = str_replace($str_to_replace, $replace_data_str, $data);

	// insert statement for iobdata table
	$insert_iob = "INSERT INTO iobdata (ip, data) VALUES ('$ip', '$extended_data')";
	if($log){
		$logger = $logger . 'Insert statement for iobdata table: ' . $insert_iob . "\n";
	}
	if($echo){
		echo 'Insert statement for iobdata table: ' . $insert_iob . "\n";
	}

	// insert into iobdata table
	$result = pg_query($pgsql_conn, $insert_iob);
	if (!$result) {
	  echo "An error occurred while inserting to iobdata table.\n";
	  exit;
	}
	if($log){
		$logger = $logger . 'Successfully added data to iobdata table! ' . "\n"; 
	}
	if($echo){
		echo 'Successfully added data to iobdata table! ' . "\n"; 
	}
}

// check if device already exists in table
$exists_query = "SELECT COUNT(device_id) FROM devices WHERE device_id = '$device_id'";
$result = pg_query($pgsql_conn, $exists_query);
if (!$result) {
  echo "An error occurred while inserting to devices table.\n";
  exit;
}

$device_exists = pg_fetch_row($result);
if(intval($device_exists[0]) != 1){
	// insert statement devices table
	$insert_devices = "INSERT INTO devices VALUES ('$device_id', '$theft_protection')";
	if($log){
		$logger = $logger . 'insert statement for devices table: ' . $insert_devices . "\n"; 
	}
	if($echo){
		echo 'insert statement for devices table: ' . $insert_devices . "\n"; 
	}

	// insert into devices table
	$result = pg_query($pgsql_conn, $insert_devices);
	if (!$result) {
		echo "An error occurred while inserting to devices table.\n";
	exit;
	}
	if($log){
		$logger = $logger . 'Successfully added data to devices table! ' . "\n"; 
	}
	if($echo){
		echo 'Successfully added data to devices table! ' . "\n"; 
	}
}
if($log){
	$logger = $logger . 'Device did already exist: ' . $device_id . "\n"; 
}
if($echo){
	echo 'Device did already exist: ' . $device_id . "\n"; 
}

// insert statement messages table
$insert_messages = "INSERT INTO messages (device_id, lon, lat, time, temp) VALUES ('$device_id', $lon_decimal, $lat_decimal, '$timestamp', '$temperature_integer')";
if($log){
	$logger = $logger . 'insert statement for messages table: ' . $insert_messages . "\n"; 
}
if($echo){
	echo 'insert statement for messages table: ' . $insert_messages . "\n"; 
}

// insert into messages table
$result = pg_query($pgsql_conn, $insert_messages);
if (!$result) {
  echo "An error occurred while inserting to messages table.\n";
  exit;
}
if($log){
	$logger = $logger . 'Successfully added data to messages table! ' . "\n"; 
}
if($echo){
	echo 'Successfully added data to messages table! ' . "\n"; 
}

// log to file
if($log){
	// output log
	$myfile = fopen("LOGGER_insert.txt", "w") or die("Unable to open file!");
	fwrite($myfile, $logger);
	fclose($myfile);
}

?>