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
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        dueDate: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
