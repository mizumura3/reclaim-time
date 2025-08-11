// Background Service Worker for Reclaim Time Extension

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Reclaim Time extension installed');
  // Initialize storage with empty blocked sites
  chrome.storage.local.set({ blockedSites: [] });
});

// Check if current time is before unblock time
function isBlocked(unblockTime) {
  const now = new Date();
  const [hours, minutes] = unblockTime.split(':').map(Number);
  const unblockDate = new Date();
  unblockDate.setHours(hours, minutes, 0, 0);
  
  // If unblock time is earlier than current time, assume it's for tomorrow
  if (unblockDate < now) {
    unblockDate.setDate(unblockDate.getDate() + 1);
  }
  
  return now < unblockDate;
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
    
    // Check if current time is within blocked period
    if (!isBlocked(site.unblockTime)) continue;
    
    // Check if URL matches the pattern
    const pattern = site.pattern || site.url;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    
    if (regex.test(urlObj.hostname) || regex.test(url)) {
      return {
        blocked: true,
        site: site,
        remainingTime: getRemainingTime(site.unblockTime)
      };
    }
  }
  
  return { blocked: false };
}

// Calculate remaining time until unblock
function getRemainingTime(unblockTime) {
  const now = new Date();
  const [hours, minutes] = unblockTime.split(':').map(Number);
  const unblockDate = new Date();
  unblockDate.setHours(hours, minutes, 0, 0);
  
  if (unblockDate < now) {
    unblockDate.setDate(unblockDate.getDate() + 1);
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
        unblockTime: blockInfo.site.unblockTime,
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
        unblockTime: blockInfo.site.unblockTime,
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