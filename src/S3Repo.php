<?php

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

class S3Repository {
  private $__s3_client = null;
  private $__s3_bucket = null;
  private $__s3_region = null;

  public static $denied_extensions = ['php'];

  static function instance() {
    return new S3Repository(
      getenv('AWS_ACCESS_KEY_ID'),
      getenv('AWS_SECRET_ACCESS_KEY'),
      getenv('AWS_BUCKET'),
      getenv('AWS_DEFAULT_REGION'),
    );
  }

  function __construct(
    string $access_key_id, 
    string $access_key_secret, 
    string $bucket, 
    string $region
  ) {
    $this->__s3_bucket = $bucket;
    $this->__s3_region = $region;
    $this->__s3_client = new S3Client([
      'region' => $region, // Change to your desired AWS region
      'credentials' => [
          'key'    => $access_key_id,
          'secret' => $access_key_secret,
      ],
    ]);
  }

  public function get_file(string $object_key) {
    try {
      $result = $this->__s3_client->getObject([
        'Bucket' => $this->__s3_bucket,
        'Key'    => S3_BASE_PATH.'/'.$object_key,
      ]);

      return $result['Body']->getContents();
    } catch (AwsException $e) {
      showErrorV2($e->getMessage());
    }
  }

  public function upload_file(
    string $path, $file = null, $replace = false) {
    try {
      if ($file == null) {
        throw new ErrorException('file cannot be null');
      };

      $fileName = $file['name'];
      $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
      if (in_array($extension, S3Repository::$denied_extensions)) {
        showErrorV2("File type $extension not allowed!");
      }
    
      $uniqueFileName = $replace 
        ? $fileName 
        : uniqid() . '.' . $extension;
  
    
      $this->__s3_client->putObject([
        'Bucket' => $this->__s3_bucket,
        'Key'    => S3_BASE_PATH.'/'. $path . '/' . $uniqueFileName,
        'Body'   => fopen($file['tmp_name'], 'rb'),
        'ContentType' => mime_content_type($file['tmp_name']),
      ]);
  
      return [
        'path' => $this->__s3_client->getObjectUrl($this->__s3_bucket, S3_BASE_PATH.'/'.$path . '/' . $uniqueFileName),
        'name' => $uniqueFileName,
      ];
    } catch (AwsException $e) {
        showError($e->getMessage());
    }
  }

  public function delete_files(array $paths) {
    try {
      $result = $this->__s3_client->deleteObjects([
        'Bucket' => $this->__s3_bucket,
        'Delete' => [
          'Objects' => $paths,
        ],
      ]);

      return $result['Deleted'];

    } catch (AwsException $e) {
      showErrorV2($e->getMessage());
    }
  }

  public function delete_file(string $path) {
    try {
      exec('curl -X DELETE "https://'
      .$this->__s3_bucket.'.s3.'
      .$this->__s3_region.'.amazonaws.com/'
      .$path.'"', $output, $return_var);

      if ($return_var != 0) {
        throw new Exception('Deleting failed');
      }

      return $output;

    } catch (Exception $e) {
      showErrorV2($e->getMessage());
    }
  }

  public function check_if_file_exists(string $path) {
    try {
      return $this->__s3_client->doesObjectExist(
        $this->__s3_bucket, S3_BASE_PATH.'/'.$path
      );
    } catch (AwsException $e) {
      showErrorV2($e->getMessage());
    }
  }

  public function copy_file(string $source, string $destination) {
    try {
      return $this->__s3_client->copyObject([
        'Bucket' => $this->__s3_bucket,
        'CopySource' => "{$this->__s3_bucket}/".S3_BASE_PATH."/{$source}",
        'Key' => $destination,
      ]);
    } catch (AwsException $e) {
      showErrorV2($e->getMessage());
    }
  }

  public function rename(string $source, string $destination, $dupl = false) {
    try {
      $this->copy_file($source, $destination);
      if ($this->check_if_file_exists($destination)) {
        if (!$dupl) $this->delete_file($source);
      }
    } catch (AwsException $e) {
      showErrorV2($e->getMessage());
    }
  }

  public function list_files(string $path) {
    try {
      $__objects = [];
      $objects = $this->__s3_client->listObjectsV2([
          'Bucket' => $this->__s3_bucket,
          'Prefix' => S3_BASE_PATH.'/'.$path,
      ]);

      if ($objects['Contents']) {
        foreach ($objects['Contents'] as $object) {
          $__objects[] = [
            'path' => $this->__s3_client->getObjectUrl($this->__s3_bucket, $object['Key']),
            'size' => $object['Size'],
          ];
        }
      }

      
      return $__objects;
    } catch (AwsException $e) {
      showErrorV2($e->getMessage());
    }
  }
}