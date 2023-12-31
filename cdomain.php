<?php
require "barrel.php";
// Define the folder name and domain name
$folderName = $_GET['fn']; // Replace with the actual folder name
$domainName = $_GET['dn']; // Replace with the actual domain name

// Read the existing configuration file
$configFile = __DIR__ . "/$folderName/$folderName.conf"; // Replace with the actual path to your config file
// $configSSLFile = __DIR__ . "/$folderName/.site-ssl"; // Replace with the actual path to your config file

$config = file_get_contents('example.site');
// $configSSL = file_get_contents('example.site');

$config = str_replace("site.folder", $folderName, $config);
$config = str_replace("domain.space", $domainName, $config);

// $configSSL = str_replace("site.folder", $folderName, $configSSL);
// $configSSL = str_replace("domain.space", $domainName, $configSSL);

file_put_contents($configFile, $config);
// file_put_contents($configSSLFile, $configSSL);
//TODO Handle failure to create custom domain configuration
$command = "curl -X POST -d 'folder=$folderName&domain=$domainName' http://127.0.0.1:3000/runcertbot";
$output = shell_exec($command);

header("HTTP/1.1 200 OK");
echo "Configuration updated successfully.";
exit;
?>