/**
 * summaryService.js
 * ───────────────────────────────────────────────────────────
 * Generates a 2-3 line summary of blog content using the
 * Google Gemini API (free tier).
 *
 * Key design decisions:
 * - Summary is generated ONCE at create/update time and stored.
 * - A SHA-256 content hash prevents redundant API calls.
 * - Graceful fallback: if the API fails, we use the first
 *   150 characters of the content so blog creation never breaks.
 * ───────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

let genAI = null;
let model = null;

// Lazy-initialize the Gemini client (only when first needed)
function getModel() {
    if (model) return model;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[Summary] ⚠ GEMINI_API_KEY not set — summaries will use fallback');
        return null;
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('[Summary] ✔ Gemini model initialized');
    return model;
}

/**
 * Compute a SHA-256 hash of the content string.
 * Used to detect whether content has actually changed.
 */
function hashContent(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Fallback summary: first 150 chars + ellipsis.
 */
function fallbackSummary(content) {
    if (!content) return '';
    const clean = content.replace(/\s+/g, ' ').trim();
    return clean.length > 150 ? clean.substring(0, 150) + '…' : clean;
}

/**
 * Generate a summary via the Gemini API.
 * Returns { summary, contentHash }.
 *
 * @param {string} content     — the blog body text
 * @param {string} existingHash — the stored contentHash (if any)
 * @returns {Promise<{ summary: string, contentHash: string, skipped: boolean }>}
 */
async function generateSummary(content, existingHash = '') {
    if (!content || typeof content !== 'string') {
        console.log('[Summary] ⚠ Empty/invalid content — using fallback');
        return { summary: '', contentHash: '', skipped: false };
    }

    const newHash = hashContent(content);

    // Skip if content hasn't changed
    if (existingHash && newHash === existingHash) {
        console.log('[Summary] ⏭ Content unchanged (hash match) — skipping generation');
        return { summary: null, contentHash: newHash, skipped: true };
    }

    const geminiModel = getModel();
    if (!geminiModel) {
        console.log('[Summary] ⚠ No Gemini model available — using fallback');
        return { summary: fallbackSummary(content), contentHash: newHash, skipped: false };
    }

    try {
        console.log('[Summary] 🚀 Generating summary via Gemini API...');

        const prompt = `You are a blog content summarizer. Summarize the following blog post in exactly 2-3 concise sentences. The summary should capture the key ideas and be engaging for readers browsing a blog listing page. Do not use markdown formatting, bullet points, or headers — just plain text sentences.\n\nBlog content:\n${content.substring(0, 4000)}`; // Cap input to ~4k chars

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const summary = response.text().trim();

        if (!summary) {
            throw new Error('Empty response from Gemini');
        }

        console.log(`[Summary] ✔ Generated (${summary.length} chars)`);
        return { summary, contentHash: newHash, skipped: false };
    } catch (error) {
        console.error(`[Summary] ✘ Gemini API error: ${error.message} — using fallback`);
        return { summary: fallbackSummary(content), contentHash: newHash, skipped: false };
    }
}

module.exports = { generateSummary, hashContent };
