/**
 * Social Media Firestore Sync
 * 
 * Syncs all social media scheduling data to Firestore for tracking,
 * analytics, and cross-device access.
 * 
 * Collections:
 * - social_posts: All scheduled/completed posts across platforms
 * - social_videos: Video content metadata
 * - social_uploads: Upload attempts and results
 * - social_analytics: Performance metrics
 * - social_credentials: Platform credentials (encrypted)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let app;
let db;

function initFirestore() {
  if (!db) {
    const serviceAccount = require('../firebase-service-account.json');
    app = initializeApp({ credential: cert(serviceAccount) }, 'social-sync');
    db = getFirestore(app);
  }
  return db;
}

/**
 * Save a scheduled post to Firestore
 */
async function savePost(postData) {
  const db = initFirestore();
  const postId = `${postData.platform}_${postData.videoId}_${postData.scheduledDate}`;
  
  const doc = {
    ...postData,
    postId,
    status: 'scheduled',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    _syncVersion: '1.0'
  };
  
  await db.collection('social_posts').doc(postId).set(doc, { merge: true });
  console.log(`💾 Saved post to Firestore: ${postId}`);
  return postId;
}

/**
 * Update post status after upload attempt
 */
async function updatePostStatus(postId, status, result = {}) {
  const db = initFirestore();
  
  await db.collection('social_posts').doc(postId).update({
    status,
    result,
    updatedAt: FieldValue.serverTimestamp(),
    [`history.${status}`]: FieldValue.serverTimestamp()
  });
  
  console.log(`🔄 Updated post ${postId} → ${status}`);
}

/**
 * Save video metadata
 */
async function saveVideo(videoData) {
  const db = initFirestore();
  
  const doc = {
    ...videoData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    uploadStatus: {
      tiktok: 'pending',
      instagram: 'pending',
      youtube: 'pending',
      x: 'pending',
      linkedin: 'pending'
    }
  };
  
  await db.collection('social_videos').doc(videoData.id).set(doc, { merge: true });
  console.log(`💾 Saved video to Firestore: ${videoData.id}`);
  return videoData.id;
}

/**
 * Update video upload status for a platform
 */
async function updateVideoStatus(videoId, platform, status, details = {}) {
  const db = initFirestore();
  
  await db.collection('social_videos').doc(videoId).update({
    [`uploadStatus.${platform}`]: status,
    [`uploadDetails.${platform}`]: {
      ...details,
      updatedAt: FieldValue.serverTimestamp()
    },
    updatedAt: FieldValue.serverTimestamp()
  });
  
  console.log(`🔄 Updated ${videoId} → ${platform}: ${status}`);
}

/**
 * Log an upload attempt
 */
async function logUploadAttempt(data) {
  const db = initFirestore();
  
  const logId = `upload_${Date.now()}_${data.platform}`;
  const doc = {
    ...data,
    logId,
    timestamp: FieldValue.serverTimestamp(),
    _type: 'upload_attempt'
  };
  
  await db.collection('social_uploads').doc(logId).set(doc);
  console.log(`📝 Logged upload attempt: ${logId}`);
  return logId;
}

/**
 * Save analytics snapshot
 */
async function saveAnalytics(platform, metrics) {
  const db = initFirestore();
  const date = new Date().toISOString().split('T')[0];
  
  const doc = {
    platform,
    date,
    metrics,
    timestamp: FieldValue.serverTimestamp()
  };
  
  await db.collection('social_analytics').doc(`${platform}_${date}`).set(doc, { merge: true });
}

/**
 * Get posts by status
 */
async function getPostsByStatus(status, platform = null) {
  const db = initFirestore();
  let query = db.collection('social_posts').where('status', '==', status);
  
  if (platform) {
    query = query.where('platform', '==', platform);
  }
  
  const snapshot = await query.orderBy('scheduledDate').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get pending uploads
 */
async function getPendingUploads() {
  const db = initFirestore();
  const snapshot = await db.collection('social_videos')
    .where('uploadStatus.tiktok', '==', 'pending')
    .orWhere('uploadStatus.instagram', '==', 'pending')
    .orWhere('uploadStatus.youtube', '==', 'pending')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Full sync - save all video data and schedule
 */
async function syncVideoSeries(videos, scheduleConfig = {}) {
  const results = [];
  
  for (const video of videos) {
    // Save video metadata
    await saveVideo(video);
    
    // Create posts for each platform
    for (const [platform, enabled] of Object.entries(scheduleConfig)) {
      if (!enabled) continue;
      
      const postId = await savePost({
        videoId: video.id,
        platform,
        title: video.title,
        caption: video.caption,
        filePath: video.file,
        scheduledDate: video.scheduleDate,
        contentType: 'video'
      });
      
      results.push({ videoId: video.id, platform, postId });
    }
  }
  
  console.log(`\n✅ Synced ${videos.length} videos with ${results.length} posts to Firestore`);
  return results;
}

/**
 * Get dashboard data
 */
async function getDashboardData() {
  const db = initFirestore();
  
  const [postsSnap, videosSnap, uploadsSnap] = await Promise.all([
    db.collection('social_posts').get(),
    db.collection('social_videos').get(),
    db.collection('social_uploads').orderBy('timestamp', 'desc').limit(10).get()
  ]);
  
  const posts = postsSnap.docs.map(d => d.data());
  const videos = videosSnap.docs.map(d => d.data());
  const uploads = uploadsSnap.docs.map(d => d.data());
  
  return {
    summary: {
      totalPosts: posts.length,
      totalVideos: videos.length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      published: posts.filter(p => p.status === 'published').length,
      failed: posts.filter(p => p.status === 'failed').length
    },
    platformBreakdown: {
      tiktok: posts.filter(p => p.platform === 'tiktok').length,
      instagram: posts.filter(p => p.platform === 'instagram').length,
      youtube: posts.filter(p => p.platform === 'youtube').length,
      x: posts.filter(p => p.platform === 'x').length,
      linkedin: posts.filter(p => p.platform === 'linkedin').length
    },
    recentUploads: uploads,
    upcomingPosts: posts
      .filter(p => p.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .slice(0, 10)
  };
}

module.exports = {
  savePost,
  updatePostStatus,
  saveVideo,
  updateVideoStatus,
  logUploadAttempt,
  saveAnalytics,
  getPostsByStatus,
  getPendingUploads,
  syncVideoSeries,
  getDashboardData
};
