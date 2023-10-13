<?php


header("Access-Control-Allow-Origin: *");
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

$logFile = __DIR__ . "/certbot_output.log";

// $command = "curl http://127.0.0.1:3000/runcertbot?domain=".$domainName."&folder=".$folderName;
// $command = "curl http://127.0.0.1:3000/runcertbot?domain=$domainName&folder=$folderName";
// $output = shell_exec($command);

// // Output the result or handle errors
// if ($output === null) {
//     echo "Error executing the command.";
//     // unlink($configSSLFile);
//     echo $output;
//     exit;
// } else {
//   // file_put_contents($configSSLFile, $configSSL);
//     // echo "Command output:\n" . $output;
// }

$curl = curl_init();

if ($curl === false) {
    echo "cURL initialization failed.";
    exit;
}

$url = "http://127.0.0.1:3000/runcertbot?domain=" . urlencode($domainName) . "&folder=" . urlencode($folderName);

curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

if ($response === false) {
  echo "cURL request failed: " . curl_error($curl);
} else {
  echo "Response:\n" . $response;
}

curl_close($curl);

header("HTTP/1.1 200 OK");
echo "Configuration updated successfully.";
exit;
?>