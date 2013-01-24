<?php
/*
    if ($_FILES["file"]["error"] > 0)
    {
        echo "Error: " . $_FILES["file"]["error"] . "<br>";
    }
    else
    {
        $filePath = $_FILES["file"]["tmp_name"];
        $fHandle = fopen($filePath, 'r');
        if($fHandle)
        {
            while(($buffer = fgets($fHandle)) !== false)
            {
                echo $buffer;
            }
            if(!feof($fHandle)){
                echo "Error: unexpected fgets() fail\n";
            }
            
            fclose($fHandle);
            unlink($filePath);
        }
    }
    */
    if(!$_FILES['uploadfile']['error'])
    {
        $filePath = $_FILES["uploadfile"]["tmp_name"];
        $fHandle = fopen($filePath, 'r');
        if($fHandle)
        {
            while(($buffer = fgets($fHandle)) !== false)
            {
                echo $buffer;
            }
            if(!feof($fHandle)){
                echo "Error: unexpected fgets() fail\n";
            }
            fclose($fHandle);
            unlink($filePath);
        }
    }
?> 