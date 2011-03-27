<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
$data = array();
$data[] = array( "id" => 1, "name" => "House");
$data[] = array( "id" => 2, "name" => "Fringe");

# search for the query in the $data array. Additionally, keep an eye on whether
# a exact match to the query already exists in the data.
$exact_match = false;
$arr = array();
foreach( $data as $entry ) { 
  if ( stristr($entry["name"], $_GET["q"]) )
    $arr[] = $entry;
    if ( $entry["name"] == $_GET["q"] ) {
      $exact_match = true;
    }
}

# if no exact match found, add a new token to let the user create it
if (!$exact_match) {
  $arr[] = array( "id" => "CREATE_".$_GET["q"]."_END", "name" => "Create \"".$_GET["q"]."\"" );
}

# JSON-encode the response
$json_response = json_encode($arr);

# Return the response
echo $json_response;
?>
