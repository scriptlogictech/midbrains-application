
const multer = require("multer");

const MAX_FILE_SIZE = 200 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    if (file.mimetype !== "image/jpeg") {
        return callback(
            new Error("Only JPG and JPEG files are allowed")
        );
    }

    callback(null, true);
};

const uploadDocument = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
});

module.exports = uploadDocument;
