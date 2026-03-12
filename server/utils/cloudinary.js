const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Multer Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'taskdep-attachments',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'csv', 'txt'], // adjust allowed formats
        // For generating a unique filename or keeping original
        public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now()
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
