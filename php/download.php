<?php
    
    $data    = $_GET['data'];
    $name    = $_GET['name'];

    Header ( "Content-Type: application/text" );
    Header ( "Content-Length: ".strlen($data) );
    Header ( "Content-Disposition: attachment; filename=".$name );

    echo $data;
?>
