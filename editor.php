<?php

require "barrel.php";

$site = $_GET['site'] ?? 'test';
//include 'editor.html';
$html = file_get_contents('editor.html');

$is_admin = $site == "template" || $site == "test";

$site_dir = __DIR__ . "/site-{$site}";

$_site = file_get_contents("example.site");
$_blank = file_get_contents("new-page-blank-template.html");

if (!is_dir($site_dir)) {
  // Run a condition to check if the Id is an actual wizard ID
  // Make a CURL request
  // Use the response
  mkdir($site_dir, 0777, true);
  file_put_contents($site_dir .'/index.html', $_blank);
  file_put_contents($site_dir .'/.site', $_site);
}

//search for html files in demo and my-pages folders
$htmlFiles = glob('{site-'.$site.'/*.html,site-'.$site.'/*\/*.html'.
  ( $is_admin ? ',demo/*\/*.html, demo/*.html': '').'}',  GLOB_BRACE);


$files = '';
foreach ($htmlFiles as $file) { 
   if (in_array($file, array('new-page-blank-template.html', 'editor.html'))) continue;//skip template files
   $pathInfo = pathinfo($file);
   $filename = $pathInfo['filename'];
   $folder = preg_replace('@/.+?$@', '', $pathInfo['dirname']);
   $subfolder = preg_replace('@^.+?/@', '', $pathInfo['dirname']);
   if ($filename == 'index' && $subfolder) {
	   $filename = $subfolder;
   }
   $url = $pathInfo['dirname'] . '/' . $pathInfo['basename'];
   $name = $filename;
   $title = ucfirst($name);

   $folder = $subfolder == "site-".$site ? "": $subfolder;

  $files .= "{name:'$name', file:'$file', title:'$title',  url: '$url', folder:'$folder'},";
}

$html = str_replace('window.SITE=""', 'window.SITE="site-'.$site.'"', $html);
//replace files list from html with the dynamic list from demo folder
$html = str_replace('(pages);', "([$files]);", $html);

echo $html;
