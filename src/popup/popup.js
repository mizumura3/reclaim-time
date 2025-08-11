// Popup script for Reclaim Time Extension

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format time for display
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
}

// Calculate remaining time
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
  
  if (hoursRemaining > 0) {
    return `${hoursRemaining}時間${minutesRemaining}分`;
  } else {
    return `${minutesRemaining}分`;
  }
}

// Load and display blocked sites
async function loadSites() {
  const result = await chrome.storage.local.get(['blockedSites']);
  const sites = result.blockedSites || [];
  
  const sitesList = document.getElementById('sitesList');
  const emptySites = document.getElementById('emptySites');
  
  sitesList.innerHTML = '';
  
  if (sites.length === 0) {
    sitesList.classList.remove('has-sites');
    emptySites.classList.add('show');
  } else {
    sitesList.classList.add('has-sites');
    emptySites.classList.remove('show');
    
    sites.forEach(site => {
      const siteElement = createSiteElement(site);
      sitesList.appendChild(siteElement);
    });
  }
}

// Create site element
function createSiteElement(site) {
  const div = document.createElement('div');
  div.className = `site-item ${!site.enabled ? 'disabled' : ''}`;
  div.dataset.siteId = site.id;
  
  const remainingTime = getRemainingTime(site.unblockTime);
  
  div.innerHTML = `
    <div class="site-header">
      <span class="site-url">${site.url}</span>
      <div class="site-controls">
        <label class="toggle-switch">
          <input type="checkbox" ${site.enabled ? 'checked' : ''} data-site-id="${site.id}">
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" data-site-id="${site.id}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
    <div class="site-info">
      <div class="info-item">
        <span>🕐 解除時刻: ${formatTime(site.unblockTime)}</span>
      </div>
      <div class="info-item">
        <span>⏱️ 残り: <span class="remaining-time">${remainingTime}</span></span>
      </div>
    </div>
  `;
  
  // Add event listeners
  const toggleInput = div.querySelector('input[type="checkbox"]');
  toggleInput.addEventListener('change', (e) => {
    toggleSite(site.id, e.target.checked);
  });
  
  const deleteBtn = div.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    deleteSite(site.id);
  });
  
  return div;
}

// Toggle site enabled/disabled
async function toggleSite(siteId, enabled) {
  const result = await chrome.storage.local.get(['blockedSites']);
  const sites = result.blockedSites || [];
  
  const siteIndex = sites.findIndex(s => s.id === siteId);
  if (siteIndex !== -1) {
    sites[siteIndex].enabled = enabled;
    await chrome.storage.local.set({ blockedSites: sites });
    
    // Update UI
    const siteElement = document.querySelector(`[data-site-id="${siteId}"]`);
    if (enabled) {
      siteElement.classList.remove('disabled');
    } else {
      siteElement.classList.add('disabled');
    }
  }
}

// Delete site
async function deleteSite(siteId) {
  if (confirm('このサイトをリストから削除しますか？')) {
    const result = await chrome.storage.local.get(['blockedSites']);
    const sites = result.blockedSites || [];
    
    const filteredSites = sites.filter(s => s.id !== siteId);
    await chrome.storage.local.set({ blockedSites: filteredSites });
    
    loadSites();
  }
}

// Add new site
async function addSite(url, unblockTime) {
  const result = await chrome.storage.local.get(['blockedSites']);
  const sites = result.blockedSites || [];
  
  // Create pattern from URL
  let pattern = url;
  if (!pattern.includes('*') && !pattern.includes('://')) {
    // Convert simple domain to pattern
    pattern = `*://*.${url}/*`;
    if (!url.includes('.')) {
      pattern = `*://*${url}*/*`;
    }
  }
  
  const newSite = {
    id: generateId(),
    url: url,
    pattern: pattern,
    unblockTime: unblockTime,
    enabled: true
  };
  
  sites.push(newSite);
  await chrome.storage.local.set({ blockedSites: sites });
  
  loadSites();
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadSites();
  
  // Set default time to current time + 2 hours
  const now = new Date();
  now.setHours(now.getHours() + 2);
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  document.getElementById('unblockTime').value = timeString;
  
  // Handle form submission
  const form = document.getElementById('addSiteForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = document.getElementById('siteUrl').value.trim();
    const unblockTime = document.getElementById('unblockTime').value;
    
    if (url && unblockTime) {
      await addSite(url, unblockTime);
      
      // Reset form
      document.getElementById('siteUrl').value = '';
      const now = new Date();
      now.setHours(now.getHours() + 2);
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      document.getElementById('unblockTime').value = timeString;
    }
  });
  
  // Update remaining times every minute
  setInterval(() => {
    loadSites();
  }, 60000);
});