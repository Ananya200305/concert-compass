console.log('background.js loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);

  const id = alarm.name;
  chrome.storage.local.get(id, (result) => {
    const event = result[id];
    if (!event) {
      console.warn('No event found in storage for', id);
      return;
    }

    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL("icons/icon.png"),
      title: `🎵 ${event.name}`,
      message: `📍 ${event.venue}, ${event.country} — 📅 ${event.date}`,
      priority: 2,
      requireInteraction: true
    }, (notifId) => {
      if (chrome.runtime.lastError) {
        console.error(' Error creating notification:', chrome.runtime.lastError);
      } else {
        console.log('Notification created with ID:', notifId);
      }
    });
  });
});

chrome.notifications.onClicked.addListener((id) => {
  chrome.storage.local.get(id, (result) => {
    const event = result[id];
    if (event?.url) chrome.tabs.create({ url: event.url });
  });
});
