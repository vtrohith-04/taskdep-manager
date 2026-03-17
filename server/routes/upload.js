const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload, cloudinary, uploadBuffer } = require('../utils/cloudinary');
const protect = require('../middleware/protect');

// @route   POST /api/upload
// @desc    Upload a file as a task attachment
// @access  Private
router.post('/', protect, upload.single('attachment'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await uploadBuffer(req.file);

        res.status(200).json({
            url: result.secure_url,
            publicId: result.public_id.split('/').pop(),
            originalName: req.file.originalname
        });
    } catch (error) {
        console.error('Upload Error:', error);
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File must be less than 5MB' });
        }
        if (error.message === 'Unsupported file type') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'File upload failed' });
    }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete a file from Cloudinary 
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
    try {
        const result = await cloudinary.uploader.destroy(`taskdep-attachments/${req.params.publicId}`);
        res.status(200).json({ message: 'File deleted', result });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'File deletion failed' });
    }
});

module.exports = router;
