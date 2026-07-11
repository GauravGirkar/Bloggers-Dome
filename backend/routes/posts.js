const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const { analyzeSentiment } = require('../services/sentimentService');
const { generateSummary } = require('../services/summaryService');

// ── GET all posts (with optional ?mood=<label> filter) ──
// ── GET all posts (with pagination, search, filter, sort) ──
router.get('/', async (req,res)=>{
    try{
        const filter = {};
        const { mood, query, sort, page = 1, limit = 9 } = req.query;

        // Validate and apply mood filter
        const validMoods = ['Uplifting', 'Thoughtful', 'Neutral', 'Raw', 'Fiery'];
        if (mood && validMoods.includes(mood)) {
            filter.mood = mood;
            console.log(`[Posts] Filtering by mood: ${mood}`);
        }

        // Apply text search on title or content
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } }
            ];
        }

        let sortOption = { createdAt: -1 }; // newest
        if (sort === 'oldest') sortOption = { createdAt: 1 };

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 9;
        const skip = (pageNum - 1) * limitNum;

        let postFetched;
        let totalPosts;

        if (sort === 'mostLiked') {
            // Aggregation pipeline to sort by size of likes array
            const pipeline = [
                { $match: filter },
                { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
                { $sort: { likesCount: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limitNum },
                { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
                { $unwind: '$author' },
                { $project: { 'author.password': 0, 'author.email': 0 } } // Exclude sensitive info
            ];
            postFetched = await Post.aggregate(pipeline);
            
            // Get total count for pagination
            const countResult = await Post.aggregate([ { $match: filter }, { $count: "total" } ]);
            totalPosts = countResult.length > 0 ? countResult[0].total : 0;
        } else {
            // Standard mongoose query
            postFetched = await Post.find(filter)
                .populate('author', 'name username profile_pic')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum);
                
            totalPosts = await Post.countDocuments(filter);
        }

        const totalPages = Math.ceil(totalPosts / limitNum);

        res.status(200).json({
            message: "Posts fetched successfully.", 
            postFetched,
            pagination: {
                totalPosts,
                totalPages,
                currentPage: pageNum,
                limit: limitNum
            }
        });
    }
    catch(error){
        console.error(error);
        res.status(500).json({message:"Server error"});
    }
})

router.get('/:id', async (req,res)=>{
    try{
        const postId = req.params.id;
        if(!mongoose.Types.ObjectId.isValid(postId)){
            return res.status(404).json({message:"Post not found!"});
        }
        const postFetched = await Post.findById(postId).populate('author', 'name username profile_pic');
        if(!postFetched){return res.status(404).json({message:"Post not found!"})}
        res.status(200).json({message:"Post fetched successfully.", postFetched})
    }
    catch(error){
        res.status(500).json({message:"Server error", error: error.message})
    }
})

// ── CREATE post (with sentiment + summary) ──
router.post('/create', authMiddleware, async (req,res)=>{
    const { title, content, image} = req.body;
    const author = req.user.id; 
    try{
        if(!title || !content || !author){
            return res.status(400).json({message:"Invalid Data"});
        }
        else{
            // Run sentiment analysis (offline, instant)
            const { mood, score } = analyzeSentiment(content);

            // Generate AI summary (async, with fallback)
            const { summary, contentHash } = await generateSummary(content);

            const postCreated = new Post({
                title,
                content,
                image,
                author,
                mood,
                sentimentScore: score,
                summary,
                contentHash,
            })

            await postCreated.save();
            return res.status(201).json({message:"Post created successfully!"});
        }
    }
    catch(error){
        return res.status(500).json({message:"Internal Server Error", error: error.message});
    }
})

// ── UPDATE post (recompute AI only if content changed) ──
router.patch('/:id', authMiddleware, async(req, res)=>{
    const postId = req.params.id;
    if(!mongoose.Types.ObjectId.isValid(postId)){
        return res.status(404).json({message:"Post not found!"});
    }    
    const { title, content, image } = req.body;
    try{
        const fetchedPost = await Post.findById(postId);
        if(!fetchedPost){return res.status(404).json({message:"Post not found"})}
        if(fetchedPost.author.toString()==req.user.id){
            const updateData = { title, content, image };

            // Only recompute AI features if content actually changed
            const contentChanged = content && content !== fetchedPost.content;

            if (contentChanged) {
                console.log(`[Posts] Content changed for post ${postId} — recomputing AI features`);

                // Re-run sentiment analysis
                const { mood, score } = analyzeSentiment(content);
                updateData.mood = mood;
                updateData.sentimentScore = score;

                // Re-generate summary
                const { summary, contentHash, skipped } = await generateSummary(content, fetchedPost.contentHash);
                if (!skipped) {
                    updateData.summary = summary;
                    updateData.contentHash = contentHash;
                }
            } else {
                console.log(`[Posts] Content unchanged for post ${postId} — skipping AI recomputation`);
            }

            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                updateData,
                {new:true}
            )
            return res.status(200).json({message:"Post updated successfully", updatedPost})
        }
        else{
            return res.status(403).json({message:"forbidden access"})
        }
    }
    catch(error){
        return res.status(500).json({message:"Server error"})
    }
})  

router.delete('/:id', authMiddleware, async(req,res)=>{
    const postId = req.params.id;
    
    if(!mongoose.Types.ObjectId.isValid(postId)){
        return res.status(404).json({message:"Post not found!"});
    }    
    try{
        const fetchedPost = await Post.findById(postId);
        if(!fetchedPost){return res.status(404).json({message:"Post not found"})}
        if(fetchedPost.author.toString()==req.user.id){
            await Post.findByIdAndDelete(postId)
            return res.status(200).json({message:"Post deleted successfully"})
        }
        else{
            return res.status(403).json({message:"forbidden access"})
        }
    }
    catch(error){
        return res.status(500).json({message:"Server error"})
    }
})

router.post('/:id/like', authMiddleware, async(req, res)=>{
    const postId = req.params.id;
    try{
        const post = await Post.findById(postId);
        if(!post){ return res.status(404).json({message:"Post not found"}) }
        
        const alreadyLiked = post.likes.includes(req.user.id);
        
        if(alreadyLiked){
            post.likes.pull(req.user.id);
            await post.save();
            return res.status(200).json({message:"Post unliked", likes: post.likes.length})
        } else {
            post.likes.push(req.user.id);
            await post.save();
            return res.status(200).json({message:"Post liked", likes: post.likes.length})
        }
    }
    catch(error){
        return res.status(500).json({message:"Server error"})
    }
})

module.exports = router;