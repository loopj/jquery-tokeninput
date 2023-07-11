<?php

#
# Example PHP server-side script for generating
# responses suitable for use with jquery-tokeninput
#

# Connect to the database
try{
$dbh = new PDO('mysql:host=host;dbname=database,user,password');
}
catch(PDOException $e){
    echo $e->getMessage();
}
# Perform the query
$query = sprintf("SELECT id, name from mytable WHERE name LIKE '%%%s%%' ORDER BY popularity DESC LIMIT 10", 
mysql_real_escape_string($_GET["q"]));

$stmt = $dbh->prepare("SELECT id, name from mytable WHERE name LIKE ? ORDER BY popularity DESC LIMIT 10");
$stmt->bindValue(1,'%%%'.htmlspecialchars($_GET["q"]).'%%%');
$stmt->execute();
$arr = array();

# Collect the results
while($obj = $stmt->stmt->fetch(PDO::FETCH_OBJ)) {
    $arr[] = $obj;
}

# JSON-encode the response
$json_response = json_encode($arr);

# Optionally: Wrap the response in a callback function for JSONP cross-domain support
if($_GET["callback"]) {
    $json_response = $_GET["callback"] . "(" . $json_response . ")";
}

# Return the response
echo $json_response;

?>
