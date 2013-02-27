var fs = require("fs");

//Returns true if a file name has "ext" extension
function fileHasExtension(file, ext){
    ext = "."+ext;
    return file.indexOf(ext, this.length - ext.length) !== -1;
}

function notBackup(file){
    return file[file.length - 1] !== '~';
}

/**
*Returns all the files paths in a directory
*@param {string} directory The directory path
*@param {Object=} options Options (optional): exclude (an array of dir paths) , extension (a String)
*/
function getFiles(directory, options){
    var i;
    if(options && options.exclude){
        for(i = 0; i < options.exclude.length; i++){
            if(directory === options.exclude[i]){
                return [];
            }
        }
    }
    var stuff = fs.list(directory);
    var files = [];
    var directories = [];
    for(i = 2; i< stuff.length; i++){//starts at 2 to skip "." and ".."
        
        var path = directory + fs.separator + stuff[i];
        if(fs.isFile(path) && (!options || !options.extension || fileHasExtension(stuff[i], options.extension)) && notBackup(stuff[i])){
            files.push(path);
        }
        
        if(fs.isDirectory(path)){
            directories.push(path);
        }
    }   
    for(i = 0; i < directories.length; i++){
        var files = files.concat(getFiles(directories[i], options));
    }
    return files;
}

