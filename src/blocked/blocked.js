// Blocked page script

// 大谷翔平の名言リスト
const OHTANI_QUOTES = [
  {
    text: "憧れるのをやめましょう",
    context: "野球の憧れを捨て、向上心に変える"
  },
  {
    text: "今日がダメでも明日頑張ればいい",
    context: "失敗を恐れずに挑戦し続ける"
  },
  {
    text: "野球を楽しむことを忘れないでください",
    context: "楽しさを忘れずに努力を続ける"
  },
  {
    text: "人生において、無駄な時間はない",
    context: "全ての経験が成長につながる"
  },
  {
    text: "努力は必ず報われる",
    context: "継続的な努力の大切さ"
  },
  {
    text: "夢は逃げない。逃げるのはいつも自分だ",
    context: "目標に向かって進み続ける決意"
  },
  {
    text: "一つひとつのプレーを大切にしたい",
    context: "今この瞬間に集中することの重要性"
  },
  {
    text: "できることからコツコツと",
    context: "小さな積み重ねが大きな成果を生む"
  },
  {
    text: "自分らしくいることが一番大事",
    context: "他人と比較せずに自分の道を歩む"
  },
  {
    text: "感謝の気持ちを忘れない",
    context: "周りの支えへの感謝を大切にする"
  },
  {
    text: "限界を決めるのは他人じゃなくて自分",
    context: "自分の可能性を信じて挑戦する"
  },
  {
    text: "今日という日は、二度と来ない貴重な一日",
    context: "時間の大切さと今日への集中"
  }
];

// ランダムに名言を選択
function getRandomOhtaniQuote() {
  const randomIndex = Math.floor(Math.random() * OHTANI_QUOTES.length);
  return OHTANI_QUOTES[randomIndex];
}

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
  
  // Display random Ohtani quote
  const quote = getRandomOhtaniQuote();
  const quoteElement = document.getElementById('ohtaniQuote');
  quoteElement.innerHTML = `${quote.text}<cite>大谷翔平からのエール</cite>`;
  document.getElementById('quoteContext').textContent = quote.context;
  
  // Set site name
  const siteName = formatSiteName(params.site);
  document.getElementById('siteName').textContent = `${siteName}のアクセスをブロック中`;
  
  // Set unlock time display based on mode
  const unblockTimeElement = document.getElementById('unblockTime');
  if (params.blockMode === 'timeRange') {
    if (params.blockStart && params.blockEnd) {
      unblockTimeElement.textContent = `${formatTime(params.blockEnd)}に解除`;
    } else {
      unblockTimeElement.textContent = '設定エラー';
    }
  } else {
    unblockTimeElement.textContent = `${formatTime(params.unblockTime)}に解除`;
  }
  
  // Start timer
  updateTimer(params);
  setInterval(() => {
    updateTimer(params);
  }, 1000);
  
  // Change quote every 30 seconds for motivation
  setInterval(() => {
    const newQuote = getRandomOhtaniQuote();
    const quoteElement = document.getElementById('ohtaniQuote');
    quoteElement.innerHTML = `${newQuote.text}<cite>大谷翔平からのエール</cite>`;
    document.getElementById('quoteContext').textContent = newQuote.context;
  }, 30000);
  
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