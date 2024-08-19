import fs from 'fs';

async function createDirectoryIfNotExists(dirPath) {
    if (dirPath) {
        try {
            // Resolve the absolute path
            const absolutePath = path.resolve(dirPath);

            // Check if the directory exists
            try {
                await fs.access(absolutePath);
                console.log('Directory already exists:', absolutePath);
            } catch (err) {
                // Directory does not exist, so create it
                await fs.mkdir(absolutePath, { recursive: true });
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

export {
    createDirectoryIfNotExists,
    removeFile

}