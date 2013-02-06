//Run this with PhantomJS
var fs = require('fs'),
toolsDir = '.'+fs.separator+'tools',
stuff = fs.list(toolsDir),
i, closureDir, newClosureDir;
for(i = 0; i < stuff.length; i++){
    if(fs.isDirectory(toolsDir+fs.separator+stuff[i])){
        if(stuff[i].substr(0,14) === 'closure_linter'){
            closureDir = toolsDir+fs.separator+stuff[i];
        }
    }
}
if(closureDir === undefined){
    console.log('ERROR: closure_lint<version> directory not found. Maybe it was not correctly extracted from the tar file.');
    phantom.exit();
}
if(!fs.exists(closureDir+fs.separator+'closure_linter'+fs.separator+'gjslint.py')){
    console.log('ERROR: ' + closureDir + ' is not a valid closure_linter directory.');
    phantom.exit();
}
newClosureDir = toolsDir+fs.separator+'closure_linter';
if(closureDir === newClosureDir){
    console.log('Closure directory already found at '+newClosureDir);
    phantom.exit();
}

console.log('Copying '+closureDir+' to '+newClosureDir+' ...');
fs.copyTree(closureDir, newClosureDir);
fs.removeTree(closureDir);
if(fs.isDirectory(newClosureDir)){
    console.log(closureDir+' succesfully renamed to '+newClosureDir);
}else{
    console.log('ERROR: Could not rename closure directory to '+newClosureDir);
}
phantom.exit();
