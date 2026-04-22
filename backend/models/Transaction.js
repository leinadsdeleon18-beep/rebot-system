const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['recycle', 'redemption', 'adjustment'],
        required: true
    },
    // For recycling
    materialType: {
        type: String,
        enum: ['bottle', 'paper', null],
        default: null
    },
    quantity: {
        type: Number,
        default: 0
    },
    weight: {
        type: Number, // in grams for paper
        default: 0
    },
    // For redemptions
    reward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward'
    },
    rewardName: String,
    // Points
    points: {
        type: Number,
        required: true
    },
    // References
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
    },
    notes: {
        type: String,
        default: ''
    },
    referenceNumber: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

// Generate reference number before saving
transactionSchema.pre('save', async function(next) {
    if (!this.referenceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.referenceNumber = `TXN-${year}${month}${day}-${random}`;
    }
    next();
});

// Index for faster queries
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ student: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);