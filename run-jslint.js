/*This file is for running with PhantomJS
    Reports problems found with JSLint
*/
var couldLoadJsLint = phantom.injectJs("tools/jslint.js");
var couldLoadGetFiles = phantom.injectJs("get-files.js");
if(!couldLoadJsLint){
    console.log("ERROR: tools/jslint.js not found");
    phantom.exit();
}
if(!couldLoadGetFiles){
    console.log("ERROR: get-files.js not found");
    phantom.exit();
}

//Returns an array with paths to js files which would be analized with JSLint
function getFilesForLint(){
    return getFiles("src", {
        extension: "js", 
        exclude: ["src"+fs.separator+"js"+fs.separator+"vendor"]
    });
}

function reportForFile(path){
    console.log("----- (JSLint) FILE  :  "+path+"   -----");
    if(!fs.exists(path)){ 
        console.log(path+" does not exist!");
        return;
    }
    if(!fs.isFile(path)){
        console.log(path+" is not a file.");
        return;
    }
    var allOk = JSLINT(fs.read(path), {
		nomen: true,
		white: true,
		browser: true,
		devel: true,
		plusplus: true
	});
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


