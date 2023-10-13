<?php


header("Access-Control-Allow-Origin: *");
// Define the folder name and domain name
$folderName = $_GET['fn']; // Replace with the actual folder name
$domainName = $_GET['dn']; // Replace with the actual domain name

// Read the existing configuration file
$configFile = __DIR__ . "/$folderName/.site"; // Replace with the actual path to your config file
$configSSLFile = __DIR__ . "/$folderName/.site-ssl"; // Replace with the actual path to your config file

$config = file_get_contents('example.site');
$configSSL = file_get_contents('example.site');

$config = str_replace("site.folder", $folderName, $config);
$config = str_replace("domain.space", $domainName, $config);

$configSSL = str_replace("site.folder", $folderName, $configSSL);
$configSSL = str_replace("domain.space", $domainName, $configSSL);

file_put_contents($configFile, $config);
file_put_contents($configSSLFile, $configSSL);

$logFile = __DIR__ . "/certbot_output.log";
$email = "obisiket@gmail.com";
$command = "sudo /usr/bin/certbot certonly --apache -d $domainName --non-interactive --agree-tos --email $email > $logFile 2>&1";

$output = shell_exec($command);

// Output the result or handle errors
if ($output === null) {
    echo "Error executing the command.";
} else {
    echo "Command output:\n" . $output;
}

shell_exec("sudo systemctl reload apache2");

header("HTTP/1.1 200 OK");
echo "Configuration updated successfully.";
exit;
?>