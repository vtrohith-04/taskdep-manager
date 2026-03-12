const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        status: {
            type: String,
            enum: ['Todo', 'In Progress', 'Done', 'Blocked'],
            default: 'Todo',
        },
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
        dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
        attachments: [{
            url: { type: String, required: true },
            publicId: { type: String, required: true },
            originalName: { type: String }
        }],
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        dueDate: { type: Date, default: null },
    },
    { timestamps: true }
);

taskSchema.index({ owner: 1, deleted: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
