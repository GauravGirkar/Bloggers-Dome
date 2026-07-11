/**
 * sentimentService.js
 * ───────────────────────────────────────────────────────────
 * Performs AFINN-based lexicon sentiment analysis on blog
 * content and maps the score to a human-readable mood label.
 *
 * No external API calls — runs entirely offline.
 * ───────────────────────────────────────────────────────────
 */

const Sentiment = require('sentiment');
const analyzer = new Sentiment();

/**
 * Tunable thresholds that map the `comparative` score
 * (normalized per-word sentiment) to a mood label.
 *
 * comparative > 0.25  → Uplifting   (strongly positive)
 * comparative > 0.05  → Thoughtful  (mildly positive / reflective)
 * comparative > -0.05 → Neutral
 * comparative > -0.25 → Raw         (mildly negative / vulnerable)
 * comparative ≤ -0.25 → Fiery       (strongly negative / intense)
 */
const MOOD_THRESHOLDS = [
    { min:  0.25, label: 'Uplifting'  },
    { min:  0.05, label: 'Thoughtful' },
    { min: -0.05, label: 'Neutral'    },
    { min: -0.25, label: 'Raw'        },
];
const DEFAULT_MOOD = 'Fiery';

/**
 * Analyze content and return { mood, score }.
 * @param {string} content — the blog body text
 * @returns {{ mood: string, score: number }}
 */
function analyzeSentiment(content) {
    if (!content || typeof content !== 'string') {
        console.log('[Sentiment] ⚠ Empty/invalid content — defaulting to Neutral');
        return { mood: 'Neutral', score: 0 };
    }

    const result = analyzer.analyze(content);
    const score = result.comparative; // normalized per-word score

    let mood = DEFAULT_MOOD;
    for (const threshold of MOOD_THRESHOLDS) {
        if (score >= threshold.min) {
            mood = threshold.label;
            break;
        }
    }

    console.log(`[Sentiment] ✔ score=${score.toFixed(4)}, mood="${mood}"`);
    return { mood, score };
}

module.exports = { analyzeSentiment };
