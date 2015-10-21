<?php
include('insert/config.php');
header('Content-Type: application/json');
$dbh = new PDO('pgsql:host=giv-iob.uni-muenster.de;port=5432;dbname=iob;', $user, $pass);
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$data = json_encode($_GET);

$log = false;
$logger = '';
if($log){
	$logger = $logger . 'data: ' . $data . "\n";
	//echo 'data: ' . $data . "\n";
}


// get position of data string
$data_pos = strpos($data, '"data":"');
$str_len = strlen('"data":"');

$data_sub = substr($data,($data_pos+$str_len), 18);
if($log){
	$logger = $logger . 'data_sub: ' . $data_sub . "\n";
	//echo 'data_sub: ' . $data_sub . "\n";
}

// lon
$lon_hex = substr($data_sub, 16, 2) . substr($data_sub, 14, 2) . substr($data_sub, 12, 2) . substr($data_sub, 10, 2);
if($log){
	$logger = $logger . 'lon_hex: ' . $lon_hex . "\n";
	//echo 'lon_hex: ' . $lon_hex . "\n";
}

// lat
$lat_hex = substr($data_sub, 8, 2) . substr($data_sub, 6, 2) . substr($data_sub, 4, 2) . substr($data_sub, 2, 2);
if($log){
	$logger = $logger . 'lat_hex: ' . $lat_hex . "\n";
	//echo 'lat_hex: ' . $lat_hex . "\n";
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

$lon_decimal = hexTo32Float($lon_hex);
if($log){
	$logger = $logger . 'lon_decimal: ' . $lon_decimal . "\n";
	//echo 'lon_decimal: ' . $lon_decimal . "\n";
}
$lat_decimal = hexTo32Float($lat_hex);
if($log){
	$logger = $logger . 'lat_decimal: ' . $lat_decimal . "\n"; 
	//echo 'lat_decimal: ' . $lat_decimal . "\n"; 
}

// append new lon + lat to $data
$str_to_replace = '"data":';
$replace_data_str = '"lon_decimal":"' . $lon_decimal . '","lat_decimal":"' . $lat_decimal . '","data":';
$extended_data = str_replace($str_to_replace, $replace_data_str, $data);

if($log){
	$logger = $logger . 'extended_data: ' . $extended_data . "\n";
	//echo 'extended_data: ' . $extended_data . "\n";
	
	// output log
	$myfile = fopen("LOGGER_insert.txt", "w") or die("Unable to open file!");
	fwrite($myfile, $logger);
	fclose($myfile);
}


$sql = 'INSERT INTO iobdata (ip, data) VALUES (:ip, :data)';
$sth = $dbh->prepare($sql);
if($sth->execute(array($_SERVER['REMOTE_ADDR'], $extended_data)) === true) {
	echo json_encode('ok');
} else {
	echo json_encode('fail');
}

?>