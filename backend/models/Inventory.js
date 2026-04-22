const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    item: {
        type: String,
        required: true,
        unique: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    threshold: {
        type: Number,
        default: 20,
        min: 0
    },
    unit: {
        type: String,
        default: 'pieces'
    },
    location: {
        type: String,
        default: 'Main Storage'
    },
    lastRestocked: {
        type: Date,
        default: null
    },
    restockHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        quantity: Number,
        previousStock: Number,
        newStock: Number,
        notes: String,
        restockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }]
}, {
    timestamps: true
});

// Virtual for low stock status
inventorySchema.virtual('isLowStock').get(function() {
    return this.stock <= this.threshold;
});

// Method to add stock with history
inventorySchema.methods.addStock = async function(quantity, userId, notes = '') {
    const previousStock = this.stock;
    this.stock += quantity;
    this.lastRestocked = new Date();
    
    this.restockHistory.push({
        date: new Date(),
        quantity: quantity,
        previousStock: previousStock,
        newStock: this.stock,
        notes: notes,
        restockedBy: userId
    });
    
    await this.save();
    return this;
};

module.exports = mongoose.model('Inventory', inventorySchema);