import React from 'react';

export default function App() {
  return (
    <div className="w-[350px] min-h-[500px] bg-black p-4 text-white rounded-2xl font-sans">
      <h1 className="text-xl font-bold mb-7 text-center">Concert Compass</h1>

      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-full mb-7">
        Connect to Spotify
      </button>

      <div className="mb-4">
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Add artist name"
            className="flex-1 px-3 py-2 rounded-full bg-white/20 text-sm"
          />
          <button
            type="submit"
            className="bg-green-400 hover:bg-green-700 text-black hover:text-gray-50 px-3 py-2 rounded-full text-sm"
          >
            Add
          </button>
        </form>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-white-600 mt-7 mb-2">Pinned Artists</h2>
        <div className="p-2 bg-white/10 rounded-full text-sm">No pinned artists yet.</div>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-white mt-7 mb-2">Your Artists</h2>
        <div className="p-2 bg-white/10 rounded-full text-sm">No artists added yet.</div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-white mt-7 mb-2">Concert Info</h2>
        <div className="bg-white/10 p-2 rounded-full text-sm">Select an artist to see concerts.</div>
      </div>
    </div>
  );
}
