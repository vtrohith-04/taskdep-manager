const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        action: { type: String, required: true }, // e.g., 'created', 'updated', 'deleted', 'completed'
        description: { type: String, required: true },
    },
    { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
