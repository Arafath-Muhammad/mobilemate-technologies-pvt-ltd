const mongoose = require('mongoose');

// Define the schema for the Inventory collection
const inventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true // Ensure stock keeping unit is unique
    },
    quantity: {
        type: Number,
        required: true,
        default: 0 // Default stock to 0
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        trim: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now // Automatically set current date when created
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Create the model from the schema
const Inventory = mongoose.model('Inventory', inventorySchema);

// Export the model
module.exports = Inventory;
