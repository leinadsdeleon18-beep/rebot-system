const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    materialType: {
        type: String,
        enum: ['pet_bottles', 'large_bottles', 'paper'],
        required: true
    },
    currentVolume: {
        type: Number,
        default: 0
    },
    capacity: {
        type: Number,
        required: true,
        default: 1500
    },
    unit: {
        type: String,
        default: 'pieces' // or kg for paper
    },
    status: {
        type: String,
        enum: ['normal', 'needs_pickup', 'full'],
        default: 'normal'
    },
    lastPickup: {
        type: Date,
        default: null
    },
    nextPickupScheduled: {
        type: Date,
        default: null
    },
    pickupHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        quantity: Number,
        weight: Number,
        notes: String,
        collectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
}, {
    timestamps: true
});

// Method to check if pickup is needed
collectionSchema.methods.needsPickup = function() {
    return (this.currentVolume / this.capacity) >= 0.8;
};

// Virtual for fill percentage
collectionSchema.virtual('fillPercentage').get(function() {
    return (this.currentVolume / this.capacity) * 100;
});

module.exports = mongoose.model('Collection', collectionSchema);