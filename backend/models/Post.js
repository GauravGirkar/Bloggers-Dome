const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
    },
    content:{
        type:String,
        required:true,
        trim:true,
    },
    image:{
        type:String,
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
}],

    // ── AI/NLP Fields ──────────────────────────────────────
    // Sentiment-Based Mood Tagging (Feature 1)
    mood: {
        type: String,
        enum: ['Uplifting', 'Thoughtful', 'Neutral', 'Raw', 'Fiery'],
        default: 'Neutral',
    },
    sentimentScore: {
        type: Number,
        default: 0,
    },

    // AI-Generated Summary (Feature 2)
    summary: {
        type: String,
        default: '',
    },
    contentHash: {
        type: String,
        default: '',
    },

},
{
    timestamps:true
})

module.exports = mongoose.model('Post',postSchema);