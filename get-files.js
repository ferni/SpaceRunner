var fs = require("fs");

//Returns true if a file name has "ext" extension
function fileHasExtension(file, ext){
    var i, index;
    ext = "." + ext;
    for(i = 0; i < ext.length; i++){
        index = (file.length - ext.length) + i;
        if(file[index] !== ext[i]){
            return false;
        }
    }
    return true;
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
        if(fs.isFile(path) && (!options || !options.extension || fileHasExtension(stuff[i], options.extension))){
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

function getOwnJsFiles() {
    var s = fs.separator,
        root = 'src',
        files;
    files = getFiles(root, {
        extension:'js',
        exclude:[root + s + 'public' + s + '_common' + s + 'vendor',
                 root + s + 'node_modules'],
    });
    files = files.concat(getFiles('src' + s + 'node_modules' + s + 'shared'));
    files = files.concat(getFiles('src' + s + 'node_modules' + s + 'client'));
    return files;
}


