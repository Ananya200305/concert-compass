import React, { useEffect, useState } from 'react';
import { Header, ConnectionBtn, ArtistSearchBar, PinnedArtist, TopArtist, NotifiedConcert, AllConcert } from './components';
import { getTopArtists } from './utils/spotify';
import { fetchConcertsForPinnedArtists } from './utils/concerts';

export default function App() {
  const [token, setToken] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [pinnedArtist, setPinnedArtist] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [notifiedConcerts, setNotifiedConcerts] = useState([]);

  const ticketmasterKey = import.meta.env.VITE_TICKETMASTER_API_KEY;


  useEffect(() => {
  chrome.storage.local.get(['spotifyToken', 'pinnedArtists', 'notifiedConcerts'], (result) => {
    if (result.spotifyToken) setToken(result.spotifyToken);
    if (result.pinnedArtists) setPinnedArtist(result.pinnedArtists);
    if (result.notifiedConcerts) setNotifiedConcerts(result.notifiedConcerts);
  });
}, []);

useEffect(() => {}, [])


  useEffect(() => {
    if (!token) return;

    getTopArtists(token).then((artists) => {
      if (artists) setTopArtists(artists);
    });
  }, [token]);


  const pinArtist = (artist) => {
    const updatedPins = [...pinnedArtist, artist].filter(
      (a, i, self) => i === self.findIndex((x) => x.name === a.name)
    );
    setPinnedArtist(updatedPins);
    chrome.storage.local.set({ pinnedArtists: updatedPins });
  };

  const unpinArtist = (artist) => {
    const updatedPins = pinnedArtist.filter((a) => a.name !== artist.name);
    setPinnedArtist(updatedPins);
    chrome.storage.local.set({ pinnedArtists: updatedPins });
  };

  const removeTopArtist = (artistToRemove) => {
    const updatedTop = topArtists.filter((artist) => artist.name !== artistToRemove.name);
    setTopArtists(updatedTop);
    chrome.storage.local.set({ topArtists: updatedTop });
  };

  const notifyDaily = (event) => {
  const notificationId = `notify-${event.id}`;

  if (notifiedConcerts.find((e) => e.id === event.id)) return;

  chrome.storage.local.set({ [notificationId]: event }, () => {
    chrome.alarms.create(notificationId, {
      delayInMinutes: 0.5,     
      periodInMinutes: 1440, 
    });

    const updated = [...notifiedConcerts, event];
    setNotifiedConcerts(updated);
    chrome.storage.local.set({ notifiedConcerts: updated });
  });
};

const unnotify = (event) => {
  const notificationId = `notify-${event.id}`;
  chrome.alarms.clear(notificationId);
  chrome.storage.local.remove(notificationId);

  const updated = notifiedConcerts.filter((e) => e.id !== event.id);
  setNotifiedConcerts(updated);
  chrome.storage.local.set({ notifiedConcerts: updated });
};


useEffect(() => {
  const loadConcerts = async () => {
    if (pinnedArtist.length > 0) {
      const data = await fetchConcertsForPinnedArtists(pinnedArtist, ticketmasterKey);
      setConcerts(data);
    } else {
      setConcerts([]);
    }
  };

  loadConcerts();
}, [pinnedArtist]);





  return (
    <div className="w-[350px] min-h-[520px] bg-[#0e0e0e] p-5 text-white rounded-2xl font-sans shadow-lg">
      <Header />
      <ConnectionBtn token={token} setToken={setToken}/>
      <ArtistSearchBar token={token} pinnedArtist={pinnedArtist} setPinnedArtist={setPinnedArtist}/>
      <PinnedArtist pinnedArtist={pinnedArtist} unpinArtist={unpinArtist}/>
      <TopArtist topArtists={topArtists} pinArtist={pinArtist} removeTopArtist={removeTopArtist}/>
      <NotifiedConcert notifiedConcerts={notifiedConcerts} unnotify={unnotify}/>
      <div>
        <h2 className="text-sm font-semibold mt-6 mb-2">Concert Info</h2>
       <AllConcert concerts={concerts} notifiedConcerts={notifiedConcerts} notifyDaily={notifyDaily}/>
      </div>



    </div>
  );
}
