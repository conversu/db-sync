import fs from 'fs';

async function createDirectoryIfNotExists(dirPath) {
    if (dirPath) {
        try {
            // Resolve the absolute path
            const absolutePath = path.resolve(dirPath);

            // Check if the directory exists
            try {
                fs.access(absolutePath);
                console.log('Directory already exists:', absolutePath);
            } catch (err) {
                // Directory does not exist, so create it
                fs.mkdir(absolutePath, { recursive: true });
                console.log('Directory created:', absolutePath);
            }
        } catch (err) {
            console.error('Error creating directory:', err);
        }
    }
}

function removeFile(path) {
    fs.unlink(path, () => { });
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

const PathUtils = {
    createDirectoryIfNotExists,
    removeFile,
    isDir,
    isFile
}

export {
    PathUtils
}