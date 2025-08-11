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

// Calculate remaining time based on site configuration
function getRemainingTime(site) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Handle time range mode
  if (site.blockMode === 'timeRange') {
    const blockStart = site.blockStart;
    const blockEnd = site.blockEnd;
    
    if (!blockStart || !blockEnd) return '設定エラー';
    
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
      // Calculate time until next block period starts
      let minutesUntilStart;
      if (startMinutes > currentMinutes) {
        minutesUntilStart = startMinutes - currentMinutes;
      } else {
        minutesUntilStart = (24 * 60) - currentMinutes + startMinutes;
      }
      
      const hoursUntilStart = Math.floor(minutesUntilStart / 60);
      const minsUntilStart = minutesUntilStart % 60;
      
      if (hoursUntilStart > 0) {
        return `${hoursUntilStart}時間${minsUntilStart}分後に開始`;
      } else {
        return `${minsUntilStart}分後に開始`;
      }
    }
    
    // Calculate time until block period ends
    let minutesUntilEnd;
    if (endMinutes > currentMinutes && startMinutes < endMinutes) {
      // Same day
      minutesUntilEnd = endMinutes - currentMinutes;
    } else {
      // Next day or cross midnight
      minutesUntilEnd = (24 * 60) - currentMinutes + endMinutes;
    }
    
    const hoursUntilEnd = Math.floor(minutesUntilEnd / 60);
    const minsUntilEnd = minutesUntilEnd % 60;
    
    if (hoursUntilEnd > 0) {
      return `${hoursUntilEnd}時間${minsUntilEnd}分`;
    } else if (minsUntilEnd > 0) {
      return `${minsUntilEnd}分`;
    } else {
      return '間もなく解除';
    }
  }
  
  // Legacy simple mode
  const unblockTime = site.unblockTime || site.blockEnd;
  if (!unblockTime) return '設定エラー';
  
  const [hours, minutes] = unblockTime.split(':').map(Number);
  const unblockDate = new Date();
  unblockDate.setHours(hours, minutes, 0, 0);
  
  // If time has passed, show "解除済み"
  if (unblockDate <= now) {
    return '解除済み';
  }
  
  const diff = unblockDate - now;
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hoursRemaining > 0) {
    return `${hoursRemaining}時間${minutesRemaining}分`;
  } else if (minutesRemaining > 0) {
    return `${minutesRemaining}分`;
  } else {
    return '間もなく解除';
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
  
  const remainingTime = getRemainingTime(site);
  
  // Generate display text based on mode
  let timeDisplayText = '';
  let modeDisplayText = '';
  
  if (site.blockMode === 'timeRange') {
    timeDisplayText = `${formatTime(site.blockStart)}-${formatTime(site.blockEnd)}`;
    modeDisplayText = '<span class="block-mode time-range">時間帯</span>';
  } else {
    timeDisplayText = formatTime(site.unblockTime || site.blockEnd || '');
    modeDisplayText = '<span class="block-mode">シンプル</span>';
  }
  
  div.innerHTML = `
    <div class="site-header">
      <span class="site-url">${site.url}${modeDisplayText}</span>
      <div class="site-controls">
        <label class="toggle-switch">
          <input type="checkbox" ${site.enabled ? 'checked' : ''} data-site-id="${site.id}">
          <span class="toggle-slider"></span>
        </label>
        <button class="edit-btn" data-site-id="${site.id}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="delete-btn" data-site-id="${site.id}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
    <div class="site-info">
      <div class="info-item">
        <span>🕐 ${site.blockMode === 'timeRange' ? 'ブロック時間帯' : '解除時刻'}: 
        <span class="time-range-display">${timeDisplayText}</span></span>
      </div>
      <div class="info-item">
        <span>⏱️ 状態: <span class="remaining-time">${remainingTime}</span></span>
      </div>
    </div>
  `;
  
  // Add event listeners
  const toggleInput = div.querySelector('input[type="checkbox"]');
  toggleInput.addEventListener('change', (e) => {
    toggleSite(site.id, e.target.checked);
  });
  
  const editBtn = div.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => {
    editSite(site.id);
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

// Add new site with support for different modes
async function addSite(url, blockMode, timeConfig) {
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
    blockMode: blockMode,
    enabled: true
  };
  
  // Set time configuration based on mode
  if (blockMode === 'timeRange') {
    newSite.blockStart = timeConfig.blockStart;
    newSite.blockEnd = timeConfig.blockEnd;
  } else {
    newSite.unblockTime = timeConfig.unblockTime;
  }
  
  sites.push(newSite);
  await chrome.storage.local.set({ blockedSites: sites });
  
  loadSites();
}

// Update time preview for time range mode
function updateTimePreview() {
  const blockStart = document.getElementById('blockStart').value;
  const blockEnd = document.getElementById('blockEnd').value;
  const preview = document.getElementById('timePreview');
  
  if (blockStart && blockEnd) {
    preview.textContent = `${formatTime(blockStart)}-${formatTime(blockEnd)}はブロック、${formatTime(blockEnd)}-翌${formatTime(blockStart)}はアクセス可能`;
  }
}

// Update time preview for edit mode
function updateEditTimePreview() {
  const blockStart = document.getElementById('editBlockStart').value;
  const blockEnd = document.getElementById('editBlockEnd').value;
  const preview = document.getElementById('editTimePreview');
  
  if (blockStart && blockEnd) {
    preview.textContent = `${formatTime(blockStart)}-${formatTime(blockEnd)}はブロック、${formatTime(blockEnd)}-翌${formatTime(blockStart)}はアクセス可能`;
  }
}

// Edit site function
async function editSite(siteId) {
  const result = await chrome.storage.local.get(['blockedSites']);
  const sites = result.blockedSites || [];
  const site = sites.find(s => s.id === siteId);
  
  if (!site) return;
  
  // Populate modal with current site data
  document.getElementById('editSiteUrl').value = site.url;
  
  // Set block mode
  const editModeRadio = document.querySelector(`input[name="editBlockMode"][value="${site.blockMode}"]`);
  if (editModeRadio) {
    editModeRadio.checked = true;
  }
  
  // Set time configuration based on mode
  if (site.blockMode === 'timeRange') {
    document.getElementById('editSimpleMode').classList.add('hidden');
    document.getElementById('editTimeRangeMode').classList.remove('hidden');
    document.getElementById('editBlockStart').value = site.blockStart || '08:00';
    document.getElementById('editBlockEnd').value = site.blockEnd || '19:00';
    updateEditTimePreview();
  } else {
    document.getElementById('editSimpleMode').classList.remove('hidden');
    document.getElementById('editTimeRangeMode').classList.add('hidden');
    document.getElementById('editUnblockTime').value = site.unblockTime || '00:00';
  }
  
  // Store current editing site ID
  document.getElementById('editSiteForm').dataset.siteId = siteId;
  
  // Show modal
  document.getElementById('editModal').classList.remove('hidden');
}

// Update site function
async function updateSite(siteId, blockMode, timeConfig) {
  const result = await chrome.storage.local.get(['blockedSites']);
  const sites = result.blockedSites || [];
  
  const siteIndex = sites.findIndex(s => s.id === siteId);
  if (siteIndex === -1) return;
  
  // Update site configuration
  sites[siteIndex].blockMode = blockMode;
  
  // Clear old time configuration
  delete sites[siteIndex].unblockTime;
  delete sites[siteIndex].blockStart;
  delete sites[siteIndex].blockEnd;
  
  // Set new time configuration
  if (blockMode === 'timeRange') {
    sites[siteIndex].blockStart = timeConfig.blockStart;
    sites[siteIndex].blockEnd = timeConfig.blockEnd;
  } else {
    sites[siteIndex].unblockTime = timeConfig.unblockTime;
  }
  
  await chrome.storage.local.set({ blockedSites: sites });
  loadSites();
}

// Load master switch state
async function loadMasterSwitch() {
  const result = await chrome.storage.local.get(['blockingEnabled']);
  const blockingEnabled = result.blockingEnabled !== false; // Default to true
  
  const masterSwitch = document.getElementById('masterSwitch');
  const switchText = document.getElementById('switchText');
  const switchDescription = document.getElementById('switchDescription');
  const container = document.querySelector('.container');
  
  masterSwitch.checked = blockingEnabled;
  
  if (blockingEnabled) {
    switchText.textContent = 'ブロック有効';
    switchDescription.textContent = '全サイトのブロックが有効です';
    container.classList.remove('blocking-disabled');
  } else {
    switchText.textContent = 'ブロック無効';
    switchDescription.textContent = '全サイトのブロックが無効です';
    container.classList.add('blocking-disabled');
  }
}

// Toggle master switch
async function toggleMasterSwitch(enabled) {
  await chrome.storage.local.set({ blockingEnabled: enabled });
  
  const switchText = document.getElementById('switchText');
  const switchDescription = document.getElementById('switchDescription');
  const container = document.querySelector('.container');
  
  if (enabled) {
    switchText.textContent = 'ブロック有効';
    switchDescription.textContent = '全サイトのブロックが有効です';
    container.classList.remove('blocking-disabled');
  } else {
    switchText.textContent = 'ブロック無効';
    switchDescription.textContent = '全サイトのブロックが無効です';
    container.classList.add('blocking-disabled');
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadSites();
  loadMasterSwitch();
  
  // Set default time to current time + 2 hours
  const now = new Date();
  now.setHours(now.getHours() + 2);
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  document.getElementById('unblockTime').value = timeString;
  
  // Handle mode selection
  const modeRadios = document.querySelectorAll('input[name="blockMode"]');
  const simpleModeDiv = document.getElementById('simpleMode');
  const timeRangeModeDiv = document.getElementById('timeRangeMode');
  
  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'timeRange') {
        simpleModeDiv.classList.add('hidden');
        timeRangeModeDiv.classList.remove('hidden');
      } else {
        simpleModeDiv.classList.remove('hidden');
        timeRangeModeDiv.classList.add('hidden');
      }
    });
  });
  
  // Handle time preview updates
  const blockStartInput = document.getElementById('blockStart');
  const blockEndInput = document.getElementById('blockEnd');
  
  [blockStartInput, blockEndInput].forEach(input => {
    input.addEventListener('change', updateTimePreview);
  });
  
  // Update preview initially
  updateTimePreview();
  
  // Handle form submission
  const form = document.getElementById('addSiteForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = document.getElementById('siteUrl').value.trim();
    const blockMode = document.querySelector('input[name="blockMode"]:checked').value;
    
    if (!url) return;
    
    let timeConfig;
    if (blockMode === 'timeRange') {
      const blockStart = document.getElementById('blockStart').value;
      const blockEnd = document.getElementById('blockEnd').value;
      
      if (!blockStart || !blockEnd) {
        alert('ブロック開始時刻と終了時刻を入力してください');
        return;
      }
      
      timeConfig = { blockStart, blockEnd };
    } else {
      const unblockTime = document.getElementById('unblockTime').value;
      
      if (!unblockTime) {
        alert('解除時刻を入力してください');
        return;
      }
      
      timeConfig = { unblockTime };
    }
    
    await addSite(url, blockMode, timeConfig);
    
    // Reset form
    document.getElementById('siteUrl').value = '';
    
    // Reset to simple mode
    document.querySelector('input[name="blockMode"][value="simple"]').checked = true;
    simpleModeDiv.classList.remove('hidden');
    timeRangeModeDiv.classList.add('hidden');
    
    // Reset time values
    const newNow = new Date();
    newNow.setHours(newNow.getHours() + 2);
    const newTimeString = `${String(newNow.getHours()).padStart(2, '0')}:${String(newNow.getMinutes()).padStart(2, '0')}`;
    document.getElementById('unblockTime').value = newTimeString;
    document.getElementById('blockStart').value = '08:00';
    document.getElementById('blockEnd').value = '19:00';
    updateTimePreview();
  });
  
  // Handle edit modal
  const editModal = document.getElementById('editModal');
  const editForm = document.getElementById('editSiteForm');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelEditBtn = document.getElementById('cancelEdit');
  
  // Handle edit mode selection
  const editModeRadios = document.querySelectorAll('input[name="editBlockMode"]');
  const editSimpleModeDiv = document.getElementById('editSimpleMode');
  const editTimeRangeModeDiv = document.getElementById('editTimeRangeMode');
  
  editModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'timeRange') {
        editSimpleModeDiv.classList.add('hidden');
        editTimeRangeModeDiv.classList.remove('hidden');
        updateEditTimePreview();
      } else {
        editSimpleModeDiv.classList.remove('hidden');
        editTimeRangeModeDiv.classList.add('hidden');
      }
    });
  });
  
  // Handle edit time preview updates
  const editBlockStartInput = document.getElementById('editBlockStart');
  const editBlockEndInput = document.getElementById('editBlockEnd');
  
  [editBlockStartInput, editBlockEndInput].forEach(input => {
    input.addEventListener('change', updateEditTimePreview);
  });
  
  // Close modal handlers
  closeModalBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });
  
  cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });
  
  // Close modal when clicking outside
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      editModal.classList.add('hidden');
    }
  });
  
  // Handle edit form submission
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const siteId = editForm.dataset.siteId;
    const blockMode = document.querySelector('input[name="editBlockMode"]:checked').value;
    
    if (!siteId) return;
    
    let timeConfig;
    if (blockMode === 'timeRange') {
      const blockStart = document.getElementById('editBlockStart').value;
      const blockEnd = document.getElementById('editBlockEnd').value;
      
      if (!blockStart || !blockEnd) {
        alert('ブロック開始時刻と終了時刻を入力してください');
        return;
      }
      
      timeConfig = { blockStart, blockEnd };
    } else {
      const unblockTime = document.getElementById('editUnblockTime').value;
      
      if (!unblockTime) {
        alert('解除時刻を入力してください');
        return;
      }
      
      timeConfig = { unblockTime };
    }
    
    await updateSite(siteId, blockMode, timeConfig);
    editModal.classList.add('hidden');
  });
  
  // Handle master switch toggle
  const masterSwitch = document.getElementById('masterSwitch');
  masterSwitch.addEventListener('change', (e) => {
    toggleMasterSwitch(e.target.checked);
  });
  
  // Update remaining times every minute
  setInterval(() => {
    loadSites();
  }, 60000);
});