/*This file is for running with PhantomJS
    Reports problems found with JSLint
*/
var couldLoadJsLint = phantom.injectJs("jslint.js");
if(!couldLoadJsLint){
    console.log("ERROR: jslint.js not found");
    phantom.exit();
}
var fs = require("fs");

//Returns true if a file name has "ext" extension
function fileHasExtension(file, ext){
    ext = "."+ext;
    return file.indexOf(ext, this.length - ext.length) !== -1;
}

function getJsFilesInDirectory(directoryPath, excludedDirectories){
    var i;
    if(excludedDirectories){
        for(i = 0; i < excludedDirectories.length; i++){
            if(directoryPath === excludedDirectories[i]){
                return [];
            }
        }
    }
    var stuff = fs.list(directoryPath);
    var jsFiles = [];
    var directories = [];
    for(i = 2; i< stuff.length; i++){//starts at 2 to skip "." and ".."
        
        var path = directoryPath + fs.separator + stuff[i];
        if(fs.isFile(path) && fileHasExtension(stuff[i], "js")){
            jsFiles.push(path);
        }
        
        if(fs.isDirectory(path)){
            directories.push(path);
        }
    }   
    for(i = 0; i < directories.length; i++){
        var jsFiles = jsFiles.concat(getJsFilesInDirectory(directories[i], excludedDirectories));
    }
    return jsFiles;
}

//Returns an array with paths to js files which would be analized with JSLint
function getFilesForLint(){
    return getJsFilesInDirectory("src", ["src"+fs.separator+"js"+fs.separator+"vendor", "src"+fs.separator+"js"+fs.separator+"test"+fs.separator+"qunit"]);
}

function reportForFile(path){
    console.log("--- (JSLint) FILE : "+path+"   ---");
    if(!fs.exists(path)){ 
        console.log(path+" does not exist!");
        return;
    }
    if(!fs.isFile(path)){
        console.log(path+" is not a file.");
        return;
    }
    var allOk = JSLINT(fs.read(path));
    if(allOk){
        console.log("JSLint found no problems.");
    }else{
        var errors = JSLINT.errors;
        for(var i = 0; i < errors.length; i++){
            if(errors[i] === null){
                break;
            }
            console.log("Line "+errors[i].line+": "+errors[i].reason);
        }
    }
}

//"Main"

var files = getFilesForLint();

for(var i = 0; i < files.length; i++){
    reportForFile(files[i]);
}
phantom.exit();


