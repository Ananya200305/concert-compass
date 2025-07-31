chrome.alarms.onAlarm.addListener((alarm) => {
  const id = alarm.name;
  chrome.storage.local.get(id, (result) => {
    const event = result[id];
    if (!event) return;

    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: event.image || 'https://via.placeholder.com/128?text=🎤',
      title: `🎵 ${event.name}`,
      message: `📍 ${event.venue}, ${event.country} — 📅 ${event.date}`,
      priority: 2,
    });
  });
});

chrome.notifications.onClicked.addListener((id) => {
  chrome.storage.local.get(id, (result) => {
    const event = result[id];
    if (event?.url) chrome.tabs.create({ url: event.url });
  });
});
