const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
    },
    { timestamps: true }
);

// Hash password before saving (Mongoose 8 - async, no next callback)
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.matchPassword = async function (entered) {
    return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
