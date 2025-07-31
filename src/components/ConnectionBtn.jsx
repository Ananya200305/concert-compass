import React, { useEffect, useState } from 'react'
import { spotifyAuthentication } from '../utils/spotifyAuth'

function ConnectionBtn({token , setToken}) {
    const [loading, setLoading] = useState(false)
    const [redirectUri, setRedirectUri] = useState('')

    useEffect(() => {
        if(chrome?.runtime?.id){
            setRedirectUri(`https://${chrome.runtime.id}.chromiumapp.org/`)
        }
    }, [])

    const handleConnection = async () => {
        if(!redirectUri) return

        setLoading(true);

        try {
            const receiveToken = await spotifyAuthentication(redirectUri)
            if(receiveToken){
                setToken(receiveToken)
            }
        } catch (error) {
            console.error("Spotify Authemtication Failed", error)
        } finally{
            setLoading(false)
        }
    }

    if(!token){
        return (
            <button onClick={handleConnection} className='w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2 rounded-full mb-7'> {loading ? "Connecting...." : "Connect to Spotify "}</button>
        )
    }else{
        return (
            <p className='text-center text-sm text-pink-400 mb-6'>Connected to Spotify</p>
        )
    }
}

export default ConnectionBtn
