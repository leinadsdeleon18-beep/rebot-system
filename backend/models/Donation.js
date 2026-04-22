const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorName: {
        type: String,
        required: [true, 'Donor name is required'],
        trim: true
    },
    donorEmail: {
        type: String,
        required: [true, 'Donor email is required'],
        lowercase: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: [50, 'Minimum donation is ₱50']
    },
    purpose: {
        type: String,
        enum: ['general', 'rewards', 'maintenance', 'expansion', 'education'],
        default: 'general'
    },
    paymentMethod: {
        type: String,
        enum: ['gcash', 'paymaya', 'bank', 'cash'],
        required: true
    },
    referenceNumber: {
        type: String,
        unique: true
    },
    message: {
        type: String,
        default: ''
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    receiptUrl: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Generate reference number before saving
donationSchema.pre('save', async function(next) {
    if (!this.referenceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.referenceNumber = `DON-${year}${month}${day}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Donation', donationSchema);