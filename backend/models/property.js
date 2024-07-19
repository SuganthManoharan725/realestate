const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    rate: { type: Number, required: true },
    image_path: { type: String, required: true },
    status: { type: String, default: 'available' },
    sqft: { type: Number, required: true },
    beds: { type: Number, required: true },
    baths: { type: Number, required: true },
    rating: { type: Number, required: true },
    booking: { type: String, required: true }
});

module.exports = mongoose.model('Property', PropertySchema);
