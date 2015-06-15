<?php
include('insert/config.php');
header('Content-Type: application/json');
$dbh = new PDO('pgsql:host=giv-iob.uni-muenster.de;port=5432;dbname=iob;', $user, $pass);
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$data = json_encode($_GET);
//echo 'data: ' . $data . "\n";

// get position of data string
$data_pos = strpos($data, '"data":"');
$str_len = strlen('"data":"');

$data_sub = substr($data,($data_pos+$str_len), 18);
//echo 'data_sub: ' . $data_sub . "\n";

// lon
$lon_hex = substr($data_sub, 16, 2) . substr($data_sub, 14, 2) . substr($data_sub, 12, 2) . substr($data_sub, 10, 2);
//echo 'lon_hex: ' . $lon_hex . "\n";
// lat
$lat_hex = substr($data_sub, 8, 2) . substr($data_sub, 6, 2) . substr($data_sub, 4, 2) . substr($data_sub, 2, 2);
//echo 'lat_hex: ' . $lat_hex . "\n";

// found parser on http://php.net/manual/de/language.types.float.php (12.06.15)
function hexTo32Float($strHex) {
    $v = hexdec($strHex);
    $x = ($v & ((1 << 23) - 1)) + (1 << 23) * ($v >> 31 | 1);
    $exp = ($v >> 23 & 0xFF) - 127;
    return round(($x * pow(2, $exp - 23)), 12);
}

//example
$lon_decimal = hexTo32Float($lon_hex); 
//echo 'lon_decimal: ' . $lon_decimal . "\n";
$lat_decimal = hexTo32Float($lat_hex);
//echo 'lat_decimal: ' . $lat_decimal . "\n"; 

// append new lon + lat to $data
$end_of_data_str = '}"}';
$replace_data_str = '}","lon_decimal":"' . $lon_decimal . '","lat_decimal":"' . $lat_decimal . '"}';
$extended_data = str_replace($end_of_data_str, $replace_data_str, $data);
//echo 'extended_data: ' . $extended_data . "\n";


$sql = 'INSERT INTO iobdata (ip, data) VALUES (:ip, :data)';
$sth = $dbh->prepare($sql);
if($sth->execute(array($_SERVER['REMOTE_ADDR'], $extended_data)) === true) {
	echo json_encode('ok');
} else {
	echo json_encode('fail');
}

?>