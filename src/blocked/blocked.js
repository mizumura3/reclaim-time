// Blocked page script

// Parse URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    site: params.get('site') || 'Unknown',
    blockMode: params.get('blockMode') || 'simple',
    blockStart: params.get('blockStart') || '',
    blockEnd: params.get('blockEnd') || '',
    unblockTime: params.get('unblockTime') || '00:00',
    originalUrl: params.get('originalUrl') || '',
    hours: parseInt(params.get('hours')) || 0,
    minutes: parseInt(params.get('minutes')) || 0
  };
}

// Update countdown timer based on block mode
function updateTimer(params) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  let shouldRedirect = false;
  let endTime = '';
  
  if (params.blockMode === 'timeRange') {
    const blockStart = params.blockStart;
    const blockEnd = params.blockEnd;
    
    if (!blockStart || !blockEnd) {
      // Invalid configuration, redirect
      shouldRedirect = true;
    } else {
      const [startH, startM] = blockStart.split(':').map(Number);
      const [endH, endM] = blockEnd.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      // Check if currently in block period
      let isInBlockPeriod = false;
      if (startMinutes < endMinutes) {
        // Same day block (e.g., 8:00-19:00)
        isInBlockPeriod = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Cross midnight block (e.g., 23:00-02:00)
        isInBlockPeriod = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
      
      if (!isInBlockPeriod) {
        shouldRedirect = true;
      } else {
        endTime = blockEnd;
      }
    }
  } else {
    // Simple mode
    const unblockTime = params.unblockTime;
    const [hours, minutes] = unblockTime.split(':').map(Number);
    const unblockDate = new Date();
    unblockDate.setHours(hours, minutes, 0, 0);
    
    if (unblockDate <= now) {
      shouldRedirect = true;
    } else {
      endTime = unblockTime;
    }
  }
  
  if (shouldRedirect) {
    // Time's up! Redirect to original URL
    if (params.originalUrl) {
      setTimeout(() => {
        window.location.href = params.originalUrl;
      }, 100); // Small delay to ensure smooth redirect
    }
    // Show 00:00:00 while redirecting
    document.getElementById('hours').textContent = '00';
    document.getElementById('minutes').textContent = '00';
    document.getElementById('seconds').textContent = '00';
    return;
  }
  
  // Calculate remaining time until end
  const [endH, endM] = endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  
  let minutesUntilEnd;
  if (params.blockMode === 'timeRange' && endMinutes < currentMinutes) {
    // End time is tomorrow
    minutesUntilEnd = (24 * 60) - currentMinutes + endMinutes;
  } else {
    // End time is today
    minutesUntilEnd = endMinutes - currentMinutes;
  }
  
  const totalSeconds = minutesUntilEnd * 60 - now.getSeconds();
  const hoursRemaining = Math.floor(totalSeconds / 3600);
  const minutesRemainingDisplay = Math.floor((totalSeconds % 3600) / 60);
  const secondsRemaining = totalSeconds % 60;
  
  document.getElementById('hours').textContent = String(Math.max(0, hoursRemaining)).padStart(2, '0');
  document.getElementById('minutes').textContent = String(Math.max(0, minutesRemainingDisplay)).padStart(2, '0');
  document.getElementById('seconds').textContent = String(Math.max(0, secondsRemaining)).padStart(2, '0');
}

// Format site name for display
function formatSiteName(site) {
  // Remove protocol and wildcards
  let formatted = site.replace(/^https?:\/\//, '')
                     .replace(/\*\:\/\//, '')
                     .replace(/\*\./, '')
                     .replace(/\/\*$/, '')
                     .replace(/\*/, '');
  
  // Capitalize first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  return formatted;
}

// Format time for display
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  const params = getUrlParams();
  
  // Set site name
  const siteName = formatSiteName(params.site);
  document.getElementById('siteName').textContent = siteName;
  
  // Set unlock time display based on mode
  const unblockTimeElement = document.getElementById('unblockTime');
  if (params.blockMode === 'timeRange') {
    if (params.blockStart && params.blockEnd) {
      unblockTimeElement.textContent = `${formatTime(params.blockStart)}-${formatTime(params.blockEnd)}のブロック終了`;
    } else {
      unblockTimeElement.textContent = '設定エラー';
    }
  } else {
    unblockTimeElement.textContent = formatTime(params.unblockTime);
  }
  
  // Start timer
  updateTimer(params);
  setInterval(() => {
    updateTimer(params);
  }, 1000);
  
  // Handle go back button
  document.getElementById('goBack').addEventListener('click', () => {
    // Try to go back in history, or close the tab
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Try to close the tab (this may not work in all browsers)
      window.close();
      // If closing doesn't work, navigate to new tab page
      window.location.href = 'chrome://newtab';
    }
  });
});