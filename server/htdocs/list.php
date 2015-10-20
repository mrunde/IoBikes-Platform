<!DOCTYPE HTML>
<html>
<head>
	<meta charset='utf-8'>
	<title>IoB Callback</title>
</head>
<style type="text/css">
	body {
		font-family: sans-serif;
	}
	table {
		border-collapse: collapse;
	}
	tr {
		border-bottom: 1px solid #ccc;
	}
	td {
		padding: 5px;
	}
	td.ip, td.data {
		font-family: monospace;
	}
</style>
<body>
<p>Last 1000 entries, latest entries above.</p>

<table>
<thead>
<tr>
	<th>IP</th>
	<th>data</th>
</tr>
</thead>
<?php
include('config.php');
$dbh = new PDO('pgsql:host='.$dbhost.';dbname='.$dbname.';', $dbuser, $dbpass);
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sql = 'SELECT * FROM iobdata ORDER BY id DESC LIMIT 1000';
foreach ($dbh->query($sql) as $row) {
?>
<tr>
	<td class="ip"><?= $row['ip'] ?></td>
	<td class="data"><?= htmlspecialchars($row['data']) ?></td>
</tr>
<?php
}
?>
</table>
</body>
</html>