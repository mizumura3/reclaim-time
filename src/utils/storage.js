// Storage utilities for Reclaim Time Extension

const StorageUtils = {
  // Storage keys
  KEYS: {
    BLOCKED_SITES: 'blockedSites',
    SETTINGS: 'settings'
  },

  // Get blocked sites from storage
  async getBlockedSites() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.BLOCKED_SITES]);
      return result[this.KEYS.BLOCKED_SITES] || [];
    } catch (error) {
      console.error('Error getting blocked sites:', error);
      return [];
    }
  },

  // Save blocked sites to storage
  async saveBlockedSites(sites) {
    try {
      await chrome.storage.local.set({ [this.KEYS.BLOCKED_SITES]: sites });
      return true;
    } catch (error) {
      console.error('Error saving blocked sites:', error);
      return false;
    }
  },

  // Add a new blocked site
  async addBlockedSite(site) {
    const sites = await this.getBlockedSites();
    sites.push(site);
    return await this.saveBlockedSites(sites);
  },

  // Update a blocked site
  async updateBlockedSite(siteId, updates) {
    const sites = await this.getBlockedSites();
    const index = sites.findIndex(s => s.id === siteId);
    
    if (index !== -1) {
      sites[index] = { ...sites[index], ...updates };
      return await this.saveBlockedSites(sites);
    }
    
    return false;
  },

  // Remove a blocked site
  async removeBlockedSite(siteId) {
    const sites = await this.getBlockedSites();
    const filteredSites = sites.filter(s => s.id !== siteId);
    return await this.saveBlockedSites(filteredSites);
  },

  // Get settings
  async getSettings() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.SETTINGS]);
      return result[this.KEYS.SETTINGS] || {
        notifications: true,
        strictMode: false,
        theme: 'light'
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        notifications: true,
        strictMode: false,
        theme: 'light'
      };
    }
  },

  // Save settings
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({ [this.KEYS.SETTINGS]: settings });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  // Clear all data
  async clearAll() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  // Listen for storage changes
  onChanged(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        callback(changes);
      }
    });
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageUtils;
}