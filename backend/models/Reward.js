const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Reward name is required'],
        unique: true,
        trim: true
    },
    points: {
        type: Number,
        required: true,
        min: [0, 'Points cannot be negative']
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    icon: {
        type: String,
        default: '🎁'
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['food', 'supplies', 'toys', 'others'],
        default: 'others'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    imageUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Virtual for checking low stock
rewardSchema.virtual('isLowStock').get(function() {
    return this.stock < 10;
});

module.exports = mongoose.model('Reward', rewardSchema);