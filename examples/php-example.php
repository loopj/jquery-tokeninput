<?
mysql_pconnect("localhost", "username", "password") or die("Could not connect");
mysql_select_db("mydatabase") or die("Could not select database");
 
$query = sprintf("SELECT id, name from mytable WHERE name LIKE '%%%s%%' ORDER BY something DESC LIMIT 10", mysql_real_escape_string($_GET["q"]));
$arr = array();
$rs = mysql_query($query);

while($obj = mysql_fetch_object($rs))
{
    $arr[] = $obj;
}

echo json_encode($arr);
?>
