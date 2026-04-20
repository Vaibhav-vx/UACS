// ═══════════════════════════════════════
// UACS Twitter API Integration
// Falls back to mock if bearer token is missing
// ═══════════════════════════════════════

import axios from 'axios';

const TWITTER_BEARER = process.env.TWITTER_BEARER_TOKEN || '';
const TWITTER_API_URL = 'https://api.twitter.com/2/tweets';

/**
 * Post a tweet via Twitter API v2
 * Auto-truncates to 280 characters
 * Falls back to mock if credentials are missing
 * 
 * @param {Object} message - The message object from DB
 * @returns {Promise<Object>} Result with success status
 */
export async function postTweet(message) {
  // Build tweet text — English version, truncated to 280 chars
  let tweetText = `🚨 ${message.title}\n\n${message.master_content}`;
  
  // Add urgency hashtag
  const urgencyTags = {
    low: '#InfoAlert',
    medium: '#Advisory',
    high: '#UrgentAlert',
    critical: '#EmergencyAlert',
  };
  const hashtag = urgencyTags[message.urgency] || '#Alert';
  
  // Truncate if too long (leave room for hashtag)
  const maxLength = 280 - hashtag.length - 2;
  if (tweetText.length > maxLength) {
    tweetText = tweetText.substring(0, maxLength - 3) + '...';
  }
  tweetText += ` ${hashtag}`;

  // Check if Twitter credentials are real
  if (!TWITTER_BEARER || TWITTER_BEARER === 'your_token_here') {
    return postTweetMock(message, tweetText);
  }

  try {
    const response = await axios.post(
      TWITTER_API_URL,
      { text: tweetText },
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`[UACS TWITTER] Tweet posted: ${response.data?.data?.id}`);
    
    return {
      success: true,
      channel: 'twitter',
      message: `Tweet posted (ID: ${response.data?.data?.id})`,
      tweetId: response.data?.data?.id,
    };
  } catch (err) {
    console.error('[UACS TWITTER] API error:', err.message);
    // Fall back to mock on failure
    return postTweetMock(message, tweetText);
  }
}

/**
 * Mock tweet poster for development
 */
async function postTweetMock(message, tweetText) {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  console.log(`[UACS TWITTER] (Mock) Tweet posted for "${message.title}"`);
  console.log(`[UACS TWITTER] (Mock) Text (${tweetText.length}/280 chars): ${tweetText.substring(0, 80)}...`);

  return {
    success: true,
    channel: 'twitter',
    message: `Tweet posted (mock) — ${tweetText.length}/280 chars`,
    tweetId: 'mock-' + Date.now(),
    mock: true,
  };
}

export default { postTweet };
