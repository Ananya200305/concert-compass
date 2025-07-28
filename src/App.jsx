import React, { useEffect, useState } from 'react';

export default function App() {
  const [token, setToken] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [redirectUri, setRedirectUri] = useState('');

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  console.log("Client ID:", clientId);
  console.log("Redirect URI:", redirectUri);

  const scopes = ['user-top-read', 'user-read-private', 'user-read-email'];

  useEffect(() => {
    if (chrome?.runtime?.id) {
      setRedirectUri(`https://${chrome.runtime.id}.chromiumapp.org/`);
    }
  }, []);

  const loginWithSpotify = () => {
    
    if (!redirectUri) return;

    const authUrl =
      `https://accounts.spotify.com/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` + 
      `&show_dialog=true`;

      console.log(authUrl)

    chrome.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true
}, function(redirectUrl) {
  if (chrome.runtime.lastError) {
    console.error("OAuth Error:", chrome.runtime.lastError.message);
    return;
  }

  console.log("Redirect URL received:", redirectUrl);

  // if (!redirectUrl.includes("access_token")) {
  //   console.error("Token not found in redirect");
  //   return;
  // }

  const code = new URLSearchParams(new URL(redirectUrl).search).get("code");
console.log("Authorization Code:", code);
  chrome.storage.local.set({ accessCode: code });
});
  };

  // Load token on mount (if saved from earlier session)
  useEffect(() => {
    chrome.storage.local.get('spotifyToken', (result) => {
      if (result.spotifyToken) {
        setToken(result.spotifyToken);
      }
    });
  }, []);

  //Fetch top artists when token becomes available
  useEffect(() => {
    if (!token) return;

    fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          const artistNames = data.items.map((artist) => artist.name);
          setTopArtists(artistNames);
          chrome.storage.local.set({ topArtists: artistNames });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch top artists:", err);
      });
  }, [token]);

  return (
    <div className="w-[350px] min-h-[500px] bg-black p-4 text-white rounded-2xl font-sans">
      <h1 className="text-xl font-bold mb-7 text-center">Concert Compass</h1>

      {!token ? (
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-full mb-7"
          onClick={loginWithSpotify}
        >
          Connect to Spotify
        </button>
      ) : (
        <p className="text-sm text-green-400 mb-4 text-center">
          Connected to Spotify
        </p>
      )}

      <div className="mb-4">
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Add artist name"
            className="flex-1 px-3 py-2 rounded-full bg-white/20 text-sm"
          />
          <button
            type="submit"
            className="bg-green-400 hover:bg-green-700 text-black hover:text-white px-3 py-2 rounded-full text-sm"
          >
            Add
          </button>
        </form>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-white mt-7 mb-2">Top Artists</h2>
        {topArtists.length > 0 ? (
          <ul className="bg-white/10 rounded-lg p-2 text-sm space-y-1">
            {topArtists.map((artist, idx) => (
              <li key={idx}>🎵 {artist}</li>
            ))}
          </ul>
        ) : (
          <div className="p-2 bg-white/10 rounded-full text-sm">
            No top artists loaded yet.
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-white mt-7 mb-2">Pinned Artists</h2>
        <div className="p-2 bg-white/10 rounded-full text-sm">No pinned artists yet.</div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-white mt-7 mb-2">Concert Info</h2>
        <div className="bg-white/10 p-2 rounded-full text-sm">
          Select an artist to see concerts.
        </div>
      </div>
    </div>
  );
}
