// Blocked page script

// Parse URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    site: params.get('site') || 'Unknown',
    unblockTime: params.get('unblockTime') || '00:00',
    originalUrl: params.get('originalUrl') || '',
    hours: parseInt(params.get('hours')) || 0,
    minutes: parseInt(params.get('minutes')) || 0
  };
}

// Update countdown timer
function updateTimer(unblockTime) {
  const now = new Date();
  const [hours, minutes] = unblockTime.split(':').map(Number);
  const unblockDate = new Date();
  unblockDate.setHours(hours, minutes, 0, 0);
  
  // If unblock time is earlier than current time, assume it's for tomorrow
  if (unblockDate < now) {
    unblockDate.setDate(unblockDate.getDate() + 1);
  }
  
  const diff = unblockDate - now;
  
  if (diff <= 0) {
    // Time's up! Redirect to original URL
    const params = getUrlParams();
    if (params.originalUrl) {
      window.location.href = params.originalUrl;
    }
    return;
  }
  
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secondsRemaining = Math.floor((diff % (1000 * 60)) / 1000);
  
  document.getElementById('hours').textContent = String(hoursRemaining).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutesRemaining).padStart(2, '0');
  document.getElementById('seconds').textContent = String(secondsRemaining).padStart(2, '0');
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  const params = getUrlParams();
  
  // Set site name
  const siteName = formatSiteName(params.site);
  document.getElementById('siteName').textContent = siteName;
  
  // Set unlock time
  document.getElementById('unblockTime').textContent = params.unblockTime;
  
  // Start timer
  updateTimer(params.unblockTime);
  setInterval(() => {
    updateTimer(params.unblockTime);
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