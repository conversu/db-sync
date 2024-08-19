import fs from 'fs';

async function createDirectoryIfNotExists(dirPath) {
    if (!dirPath) {
        return;
    }
    try {
        // Resolve the absolute path
        const absolutePath = path.resolve(dirPath);

        // Check if the directory exists
        try {
            fs.access(absolutePath);
        } catch (err) {
            // Directory does not exist, so create it
            fs.mkdir(absolutePath, { recursive: true });
        }
    } catch (err) {

    }

}

function removeFile(path) {
    if (isFile(path)) {
        fs.unlink(path, () => { });
    }
}


function isDir(dirPath) {

    if (!dirPath) {
        return false;
    }

    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

function isFile(dirPath) {

    if (!dirPath) {
        return false;
    }

    return fs.existsSync(dirPath) && fs.statSync(dirPath).isFile();
}
function exists(dirPath) {
    if (!dirPath) {
        return false;
    }
    return fs.existsSync(dirPath);
}

const PathUtils = {
    createDirectoryIfNotExists,
    removeFile,
    isDir,
    isFile,
    exists
}

export {
    PathUtils
}