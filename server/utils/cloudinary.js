const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.txt']);

function sanitizePublicId(filename) {
    return path.basename(filename, path.extname(filename))
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'attachment';
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        if (!allowedExtensions.has(extension)) {
            return cb(new Error('Unsupported file type'));
        }
        cb(null, true);
    }
});

function uploadBuffer(file) {
    return new Promise((resolve, reject) => {
        const publicId = `${sanitizePublicId(file.originalname)}-${Date.now()}`;
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'taskdep-attachments',
                public_id: publicId,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(file.buffer);
    });
}

module.exports = { cloudinary, upload, uploadBuffer };
