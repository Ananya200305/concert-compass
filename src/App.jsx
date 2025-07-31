import React, { useEffect, useState } from 'react';
import { Header } from './components';

export default function App() {
  const [token, setToken] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [redirectUri, setRedirectUri] = useState('');
  const [pinnedArtist, setPinnedArtist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [artistInput, setArtistInput] = useState('');
  const [searchError, setSearchError] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [notifiedConcerts, setNotifiedConcerts] = useState([]);

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const ticketmasterKey = import.meta.env.VITE_TICKETMASTER_API_KEY;

  const scopes = ['user-top-read', 'user-read-private', 'user-read-email'];

  useEffect(() => {
    if (chrome?.runtime?.id) {
      setRedirectUri(`https://${chrome.runtime.id}.chromiumapp.org/`);
    }
  }, []);

  // useEffect(() => {
  //   chrome.storage.local.get(['spotifyToken', 'pinnedArtists'], (result) => {
  //     if (result.spotifyToken) setToken(result.spotifyToken);
  //     if (result.pinnedArtists) setPinnedArtist(result.pinnedArtists);
  //   });
  // }, []);

  useEffect(() => {
  chrome.storage.local.get(['spotifyToken', 'pinnedArtists', 'notifiedConcerts'], (result) => {
    if (result.spotifyToken) setToken(result.spotifyToken);
    if (result.pinnedArtists) setPinnedArtist(result.pinnedArtists);
    if (result.notifiedConcerts) setNotifiedConcerts(result.notifiedConcerts);
  });
}, []);

  const loginWithSpotify = () => {
    if (!redirectUri) return;
    setLoading(true);

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes.join(' '))}&show_dialog=true`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        console.error('OAuth Error:', chrome.runtime.lastError.message);
        setLoading(false);
        return;
      }

      const code = new URLSearchParams(new URL(redirectUrl).search).get('code');

      fetch('https://concert-compass-backend.onrender.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      })
        .then((res) => res.json())
        .then((data) => {
          chrome.storage.local.set({ spotifyToken: data.access_token });
          setToken(data.access_token);
        })
        .catch((err) => console.error('Token exchange failed:', err))
        .finally(() => setLoading(false));
    });
  };

  useEffect(() => {
    if (!token) return;

    fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          console.warn("Token expired or unauthorized.");
          chrome.storage.local.remove('spotifyToken');
          setToken(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.items) {
          const artists = data.items.map((artist) => ({
            name: artist.name,
            image: artist.images?.[0]?.url || null,
          }));
          setTopArtists(artists);
          chrome.storage.local.set({ topArtists: artists });
        }
      })
      .catch((err) => console.error('Top artists fetch failed:', err));
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
    const updatedTop = [...topArtists, artist].filter(
      (a, i, self) => i === self.findIndex((x) => x.name === a.name)
    );
    setPinnedArtist(updatedPins);
    setTopArtists(updatedTop);
    chrome.storage.local.set({ pinnedArtists: updatedPins, topArtists: updatedTop });
  };

  const searchAndPin = async () => {
    if (!artistInput.trim() || !token) return;
    setSearchError(null);
    const query = artistInput.trim();

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const match = data.artists?.items?.find(
        (item) => item.name.toLowerCase() === query.toLowerCase()
      );

      if (!match) return setSearchError('Artist not found.');

      const artist = {
        name: match.name,
        image: match.images?.[0]?.url || null,
      };

      if (!pinnedArtist.some((a) => a.name === artist.name)) {
        const updatedPins = [...pinnedArtist, artist];
        setPinnedArtist(updatedPins);
        chrome.storage.local.set({ pinnedArtists: updatedPins });
        setArtistInput('');
        setSearchError(null);
      } else {
        setSearchError('Artist already pinned.');
      }
    } catch (err) {
      console.error('Error searching artist:', err);
      setSearchError('Error searching artist.');
    }
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


  const fetchConcertsForPinnedArtists = async (list) => {
    const results = [];

    for (const artist of list) {
      try {
        const res = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterKey}&keyword=${encodeURIComponent(
            artist.name
          )}&classificationName=music`
        );
        const data = await res.json();

        if (data._embedded?.events?.length > 0) {
          const events = data._embedded.events.map((event) => ({
            id: event.id,
            name: event.name,
            url: event.url,
            date: event.dates.start.localDate,
            time: event.dates.start.localTime,
            venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
            country: event._embedded?.venues?.[0]?.country?.name || 'Unknown Country',
            image: event.images?.[0]?.url || null,
          }));

          results.push({ artist: artist.name, events });
        }
      } catch (err) {
        console.error(`Failed to fetch concerts for ${artist.name}`, err);
      }
    }

    setConcerts(results);
  };

  useEffect(() => {
    if (pinnedArtist.length > 0) {
      fetchConcertsForPinnedArtists(pinnedArtist);
    } else {
      setConcerts([]);
    }
  }, [pinnedArtist]);

  


  return (
    <div className="w-[350px] min-h-[520px] bg-[#0e0e0e] p-5 text-white rounded-2xl font-sans shadow-lg">
      <Header />

      {!token ? (
        <button
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2 rounded-full mb-7"
          onClick={loginWithSpotify}
        >
          {loading ? 'Connecting...' : 'Connect to Spotify'}
        </button>
      ) : (
        <p className="text-center text-sm text-pink-400 mb-6">Connected to Spotify</p>
      )}

      <div className="flex mb-6 bg-white/10 rounded-full p-2">
        <input
          type="text"
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
          placeholder="Add an artist..."
          className="flex-1 pl-4 pr-2 py-2 rounded-full bg-[#1c1c1c] text-sm text-white focus:outline-none"
        />
        <button
          disabled={!artistInput.trim()}
          onClick={searchAndPin}
          className={`ml-2 px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 ${
            !artistInput.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Add
        </button>
      </div>
      {searchError && <p className="text-xs text-red-400 mt-1">{searchError}</p>}

      {/* Pinned Artists */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Pinned Artists</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2 shadow-inner">
          {pinnedArtist.length > 0 ? (
            pinnedArtist.map((artist, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={artist.image || 'https://via.placeholder.com/32'}
                    alt={artist.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{artist.name}</span>
                </div>
                <button
                  onClick={() => unpinArtist(artist)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full"
                >
                  Unpin
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400">No pinned artists.</p>
          )}
        </div>
      </div>

      {/* Top Artists */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Top Artists</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2 shadow-inner">
          {topArtists.length > 0 ? (
            topArtists.map((artist, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <img
                  src={artist.image || 'https://via.placeholder.com/32'}
                  alt={artist.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{artist.name}</span>
                <button onClick={() => pinArtist(artist)}>📌</button>
                <button
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full"
                  onClick={() => removeTopArtist(artist)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No top artists.</p>
          )}
        </div>
      </div>

            {notifiedConcerts.length > 0 && (
  <div className="mt-6">
    <h2 className="text-sm font-semibold mb-2 text-green-400">🎫 Notified Concerts</h2>
    <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4 text-sm text-white">
      {notifiedConcerts.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 bg-[#2a2a2a] rounded-lg p-3 hover:bg-[#333]"
        >
          <img
            src={event.image || 'https://via.placeholder.com/80?text=🎤'}
            alt={event.name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="flex-1">
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white hover:underline"
            >
              {event.name}
            </a>
            <p className="text-xs text-gray-400 mt-1">
              📅 {event.date} &nbsp;&nbsp; 🕒 {event.time || 'TBA'}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              📍 {event.venue}, {event.country}
            </p>
            <button
              onClick={() => unnotify(event)}
              className="mt-2 text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              Unnotify Me
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Concert Info */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Concert Info</h2>
        <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4 text-sm text-white">
          {concerts.length === 0 ? (
            <p className="text-gray-400 text-center">No concerts found for pinned artists.</p>
          ) : (
            concerts.map(({ artist, events }, idx) => (
              <div key={idx}>
                <h3 className="text-pink-400 font-semibold text-base mb-2">{artist}</h3>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 bg-[#2a2a2a] rounded-lg p-3 hover:bg-[#333]"
                    >
                      <img
                        src={event.image || 'https://via.placeholder.com/80?text=🎤'}
                        alt={event.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-white hover:underline"
                        >
                          {event.name}
                        </a>
                        {!notifiedConcerts.some((e) => e.id === event.id) && (
    <button
      onClick={() => notifyDaily(event)}
      className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
    >
      Notify Me
    </button>
  )}
                        <p className="text-xs text-gray-400 mt-1">
                          📅 {event.date} &nbsp;&nbsp; 🕒 {event.time || 'TBA'}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">📍 {event.venue}, {event.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>



    </div>
  );
}
