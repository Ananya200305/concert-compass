import React, { useState } from 'react';

export default function AllConcert({ concerts, notifiedConcerts, notifyDaily }) {
  const [openArtist, setOpenArtist] = useState(null);

  const toggleArtist = (artist) => {
    setOpenArtist((prev) => (prev === artist ? null : artist));
  };

  if (!concerts || concerts.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-4 text-sm text-white text-center">
        <p className="text-gray-400">No concerts found for pinned artists.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4 text-sm text-white">
      {concerts.map(({ artist, events }, idx) => (
        <div key={idx} className="border-b border-gray-600 pb-2">
          <div
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => toggleArtist(artist)}
          >
            <h3 className="text-pink-400 font-semibold text-base">{artist}</h3>
            <span className="text-white text-xs">
              {openArtist === artist ? '▲' : '▼'}
            </span>
          </div>

          {openArtist === artist && (
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
                        className="text-xs px-2 py-1 ml-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                      >
                        Notify Me
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      📅 {event.date} &nbsp;&nbsp; 🕒 {event.time || 'TBA'}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      📍 {event.venue}, {event.country}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
