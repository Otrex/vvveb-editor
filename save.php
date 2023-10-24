<?php
/*
Copyright 2017 Ziadin Givan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

https://github.com/givanz/VvvebJs
*/
require "barrel.php";


define('MAX_FILE_LIMIT', 1024 * 1024 * 2);//2 Megabytes max html file size

function showError($error) {
	header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
	die($error);
}

$html   = '';
$file   = '';
$action = '';
$_site = file_get_contents("example.site");

if (isset($_POST['startTemplateUrl']) && !empty($_POST['startTemplateUrl'])) {
	$startTemplateUrl = sanitizeFileName($_POST['startTemplateUrl']);
	$html = file_get_contents($startTemplateUrl);
	echo isset($_POST['startTemplateUrl']).'-hmm-'.!empty($_POST['startTemplateUrl']);
} else if (isset($_POST['html'])){
	$html = substr($_POST['html'], 0, MAX_FILE_LIMIT);
}

if (isset($_POST['file'])) {
	$file = sanitizeFileName($_POST['file'], false);
}

if (isset($_GET['action'])) {
	$action = $_GET['action'];
}


$actionHandler = [
	'rename' => function () {
		global $file, $_site;
		$duplicate = strToBool($_POST['duplicate']);
		$newfile = sanitizeFileName($_POST['newfile'], false);

		if (!$newfile) {
			showError('New Filename is empty!');
			exit;
		}
		
		if (!$file) {
			showError('Filename is empty!');
			exit;
		} 

		if ($duplicate) {
			$new_dir = dirname($newfile);
			$old_dir = dirname($file);
			$excluded = [
				'.', '..',
				pathinfo($file)['filename']
			];

			if (!is_dir($new_dir)){
				mkdir($new_dir, 0777, true);
				foreach (scandir($old_dir) as $f) {
					$has_excluded = array_search($f, $excluded);
					if ($has_excluded !== false) {
						continue; // Ignore hidden files
					} 

					$has_copied = copy($old_dir.'/'.$f, $new_dir.'/'.$f);
					if (!$has_copied) {
						showError("Error when copying file '$file'");
						exit;
					};
				}
			}

			if (copy($file, $newfile)) {
				echo "File '$file' copied to '$newfile'";
			} else {
				showError("Error copied file '$file' renamed to '$newfile'");
			}

		} else {
			if (rename($file, $newfile)) {
				echo "File '$file' renamed to '$newfile'";
			} else {
				showError("Error renaming file '$file' renamed to '$newfile'");
			}
		}
	},
	'delete' => function () {
		global $file;
		if ($file) {
			if (unlink($file)) {
				echo "File '$file' deleted";
			} else {
				showError("Error deleting file '$file'");
			}
		}
	},
	'saveReusable' => function () {
		global $file;
		$type = $_POST['type'] ?? false;
		$name = $_POST['name'] ?? false;
		$html = $_POST['html'] ?? false;
		
		if ($type && $name && $html) {
			
			$file = sanitizeFileName("$type/$name");
			$dir = dirname($file);
			if (!is_dir($dir)) {
				echo "$dir folder does not exist\n";
				if (mkdir($dir, 0777, true)) {
					echo "$dir folder was created\n";
				} else {
					showError("Error creating folder from reuse '$dir'\n");
				}				
			}
			
			if (file_put_contents($file, $html)) {
				echo "File saved '$file'";
			} else {
				showError("Error saving file '$file'\nPossible causes are missing write permission or incorrect file path!");
			}
		} else {
			showError("Missing reusable element data!\n");
		}
	}
];

if ($action) {
	$actionHandler[$action] 
		? $actionHandler[$action]() 
		: showError("Invalid action '$action'!");
	exit;
}

if (!$html) {
	showError('Html content is empty!');
	exit;
}

if (!$file) {
	showError('Filename is empty!');
	exit;
} 

$dir = dirname($file);

if (!is_dir($dir)) {
	if (mkdir($dir, 0777, true)) {
		echo "$dir folder was created\n";
	} else {
		showError("Error creating folder '$dir'\n");
	}
}

header("HTTP/1.1 200 OK");
if (file_put_contents($file, $html)) {
	echo "File saved '$file'";
} else {
	showError("Error saving file '$file'\nPossible causes are missing write permission or incorrect file path!");
}	
