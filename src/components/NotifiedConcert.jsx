import React from 'react'

function NotifiedConcert({notifiedConcerts, unnotify}) {

    if (notifiedConcerts.length === 0) return null;

  return (
    <div className='mt-6'>
      <h2 className='text-sm font-semibold mb-3 text-white'>Notified Concerts</h2>
        <div className='bg-[#1a1a1a] rounded-xl p-4 space-y-4 text-sm text-white'>
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
                className="mt-2 text-xs px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full"
              >
                Unnotify Me
              </button>
            </div>
          </div>
            ))}
        </div>
      </div>
  )
}

export default NotifiedConcert
