<?php
require 'vendor/autoload.php';
define('S3_BASE_PATH', "editor");

use Dotenv\Dotenv;

(function() {
  //ts-ignore: true
  Dotenv::createUnsafeImmutable(__DIR__ . '/')->load();
})();

function resolveIsset(array $arr, string $key) {
  return isset($arr[$key]) && !empty($arr[$key]) ? $arr[$key] : null;
}

function showErrorV2($error) {
	header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
	die($error);
}


function clog($args) {
  echo "<pre>";
  echo json_encode([ 'message' => $args ]);
  echo "</pre>";
}

function strToBool($str) {
  if (!$str) return false;
  if (strtolower($str) == 'true') return true;
  return false;
}

function sanitizeFileNameV2($file, $allowedExtension = 'html') {
	//sanitize, remove double dot .. and remove get parameters if any
	$file = preg_replace('@\?.*$@' , '', preg_replace('@\.{2,}@' , '', preg_replace('@[^\/\\a-zA-Z0-9\-\._]@', '', $file)));
	
	//allow only .html extension
	if ($allowedExtension) {
		$file = preg_replace('/\.[^.]+$/', '', $file) . ".$allowedExtension";
	}
	return $file;
}

function sanitizeFileName($file, $allowedExtension = 'html') {
	//sanitize, remove double dot .. and remove get parameters if any
	$file = __DIR__ . '/' . preg_replace('@\?.*$@' , '', preg_replace('@\.{2,}@' , '', preg_replace('@[^\/\\a-zA-Z0-9\-\._]@', '', $file)));
	return $allowedExtension ? preg_replace('/\.[^.]+$/', '', $file) . ".$allowedExtension" : $file;
}