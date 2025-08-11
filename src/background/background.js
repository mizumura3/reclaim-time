// Background Service Worker for Reclaim Time Extension
// Using Chrome Extension Manifest V3 APIs

/* global chrome */

// Initialize extension on install
// Note: In Manifest V3, addListener is the standard API for event handling
// The IDE warning about deprecation is incorrect - this is the official Chrome Extensions API
chrome.runtime.onInstalled.addListener(() => {
  console.log('Reclaim Time extension installed');
  // Initialize storage with empty blocked sites
  chrome.storage.local.set({ blockedSites: [] });
});

// Check if site should be blocked based on configuration
function isBlocked(siteConfig) {
  // Support both old format (unblockTime) and new format (blockStart/blockEnd)
  if (siteConfig.blockMode === 'timeRange') {
    return isBlockedInTimeRange(siteConfig.blockStart, siteConfig.blockEnd);
  } else {
    // Legacy format: simple unblock time
    return isBlockedUntilTime(siteConfig.unblockTime || siteConfig.blockEnd);
  }
}

// Time range blocking logic (8:00-19:00 blocked, 19:00-8:00 accessible)
function isBlockedInTimeRange(blockStart, blockEnd) {
  if (!blockStart || !blockEnd) return false;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = blockStart.split(':').map(Number);
  const [endH, endM] = blockEnd.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  // Case 1: Block period doesn't cross midnight (e.g., 8:00-19:00)
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Case 2: Block period crosses midnight (e.g., 23:00-02:00)
  else if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  // Case 3: Same time (24-hour block)
  else {
    return true;
  }
}

// Legacy simple time blocking (until specific time)
function isBlockedUntilTime(unblockTime) {
  if (!unblockTime) return false;
  
  const now = new Date();
  const [hours, minutes] = unblockTime.split(':').map(Number);
  const unblockDate = new Date();
  unblockDate.setHours(hours, minutes, 0, 0);
  
  // If the unblock time has already passed today, the site should not be blocked
  // Only block if the unblock time is in the future (later today)
  return unblockDate > now;
}

// Get blocked sites from storage
async function getBlockedSites() {
  const result = await chrome.storage.local.get(['blockedSites']);
  return result.blockedSites || [];
}

// Check if URL matches any blocked pattern
async function isUrlBlocked(url) {
  const blockedSites = await getBlockedSites();
  const urlObj = new URL(url);
  
  for (const site of blockedSites) {
    if (!site.enabled) continue;
    
    // Check if current time is within blocked period using new logic
    if (!isBlocked(site)) continue;
    
    // Check if URL matches the pattern
    const pattern = site.pattern || site.url;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    
    if (regex.test(urlObj.hostname) || regex.test(url)) {
      return {
        blocked: true,
        site: site,
        remainingTime: getRemainingTime(site)
      };
    }
  }
  
  return { blocked: false };
}

// Calculate remaining time until unblock
function getRemainingTime(siteConfig) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Handle time range mode
  if (siteConfig.blockMode === 'timeRange') {
    const blockEnd = siteConfig.blockEnd;
    if (!blockEnd) return { hours: 0, minutes: 0, totalMinutes: 0 };
    
    const [endH, endM] = blockEnd.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    
    let minutesUntilEnd;
    
    // Calculate minutes until block ends
    if (endMinutes > currentMinutes) {
      // Same day
      minutesUntilEnd = endMinutes - currentMinutes;
    } else {
      // Next day
      minutesUntilEnd = (24 * 60) - currentMinutes + endMinutes;
    }
    
    const hoursRemaining = Math.floor(minutesUntilEnd / 60);
    const minutesRemaining = minutesUntilEnd % 60;
    
    return {
      hours: hoursRemaining,
      minutes: minutesRemaining,
      totalMinutes: minutesUntilEnd
    };
  }
  
  // Legacy simple mode
  const unblockTime = siteConfig.unblockTime || siteConfig.blockEnd;
  if (!unblockTime) return { hours: 0, minutes: 0, totalMinutes: 0 };
  
  const [hours, minutes] = unblockTime.split(':').map(Number);
  const unblockDate = new Date();
  unblockDate.setHours(hours, minutes, 0, 0);
  
  // Only calculate remaining time if unblock time is in the future
  if (unblockDate <= now) {
    return {
      hours: 0,
      minutes: 0,
      totalMinutes: 0
    };
  }
  
  const diff = unblockDate - now;
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    hours: hoursRemaining,
    minutes: minutesRemaining,
    totalMinutes: Math.floor(diff / (1000 * 60))
  };
}

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    const blockInfo = await isUrlBlocked(tab.url);
    
    if (blockInfo.blocked) {
      // Redirect to blocked page
      const blockedUrl = chrome.runtime.getURL('src/blocked/blocked.html');
      const params = new URLSearchParams({
        site: blockInfo.site.url,
        blockMode: blockInfo.site.blockMode || 'simple',
        blockStart: blockInfo.site.blockStart || '',
        blockEnd: blockInfo.site.blockEnd || blockInfo.site.unblockTime || '',
        unblockTime: blockInfo.site.unblockTime || blockInfo.site.blockEnd || '',
        originalUrl: tab.url,
        hours: blockInfo.remainingTime.hours,
        minutes: blockInfo.remainingTime.minutes
      });
      
      chrome.tabs.update(tabId, {
        url: `${blockedUrl}?${params.toString()}`
      });
    }
  }
});

// Handle navigation events for more reliable blocking
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId === 0) { // Only check main frame
    const blockInfo = await isUrlBlocked(details.url);
    
    if (blockInfo.blocked) {
      const blockedUrl = chrome.runtime.getURL('src/blocked/blocked.html');
      const params = new URLSearchParams({
        site: blockInfo.site.url,
        blockMode: blockInfo.site.blockMode || 'simple',
        blockStart: blockInfo.site.blockStart || '',
        blockEnd: blockInfo.site.blockEnd || blockInfo.site.unblockTime || '',
        unblockTime: blockInfo.site.unblockTime || blockInfo.site.blockEnd || '',
        originalUrl: details.url,
        hours: blockInfo.remainingTime.hours,
        minutes: blockInfo.remainingTime.minutes
      });
      
      chrome.tabs.update(details.tabId, {
        url: `${blockedUrl}?${params.toString()}`
      });
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkBlocked') {
    isUrlBlocked(request.url).then(blockInfo => {
      sendResponse(blockInfo);
    });
    return true; // Indicates async response
  }
});

// Periodically check and update blocked sites (every minute)
setInterval(async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && tab.url.includes(chrome.runtime.getURL('src/blocked/blocked.html'))) {
      // Check if the blocked time has expired
      const params = new URLSearchParams(new URL(tab.url).search);
      const originalUrl = params.get('originalUrl');
      if (originalUrl) {
        const blockInfo = await isUrlBlocked(originalUrl);
        if (!blockInfo.blocked) {
          // Time expired, redirect back to original URL
          chrome.tabs.update(tab.id, { url: originalUrl });
        }
      }
    }
  }
}, 60000); // Check every minute