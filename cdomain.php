<?php


header("Access-Control-Allow-Origin: *");
// Define the folder name and domain name
$folderName = $_GET['fn']; // Replace with the actual folder name
$domainName = $_GET['dn']; // Replace with the actual domain name

// Read the existing configuration file
$configFile = __DIR__ . "/$folderName/.site"; // Replace with the actual path to your config file
$config = file_get_contents('example.site');

$config = str_replace("site-template", $folderName, $config);
$config = str_replace("mmm.otrex.space", $domainName, $config);

file_put_contents($configFile, $config);

header("HTTP/1.1 200 OK");
echo "Configuration updated successfully.";
exit;
?>