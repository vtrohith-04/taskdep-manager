const nodemailer = require('nodemailer');

// Minimal mailer utility
const sendTaskEmail = async (user, task, type) => {
    // Basic verification of required env vars - skip if not set for minimal impact
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log('✉️ Mailer: SMTP not configured, skipping email.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        let subject = '';
        let text = '';

        if (type === 'completed') {
            subject = `Task Completed: ${task.title}`;
            text = `Hello ${user.name},\n\nYour task "${task.title}" has been marked as Done.\n\nKeep up the great work!`;
        }

        await transporter.sendMail({
            from: `"TaskDep" <${process.env.FROM_EMAIL || 'notifications@taskdep.com'}>`,
            to: user.email,
            subject,
            text,
        });

        console.log(`✉️ Email sent to ${user.email} for task: ${task.title}`);
    } catch (error) {
        console.error('✉️ Mailer Error:', error.message);
    }
};

module.exports = { sendTaskEmail };
