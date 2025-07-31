const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const scope = ["user-top-read", "user-read-private", "user-read-email"];
const tokenBackend = "https://concert-compass-backend.onrender.com/api/token"

export const spotifyAuthentication = async (redirectUri) => {
    if(!redirectUri) throw new Error("Missing Redirect URI");

    return new Promise((resolve, reject) => {
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope.join(' '))}&show_dialog=true`;

        chrome.identity.launchWebAuthFlow({
            url : authUrl,
            interactive: true
        }, async(redirectUrl) => {
            if(chrome.runtime.lastError){
                return reject(new Error(chrome.runtime.lastError.message));
            }

            try {
                const code = new URLSearchParams(new URL(redirectUrl).search).get('code');
                const res = await fetch(tokenBackend,{
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code, redirectUri})
                })

                const data = await res.json();
                if(!data.access_token){
                    return reject(new Error("Token Exchange Failed"))
                }

                chrome.storage.local.set({ spotifyToken : data.access_token}, () => {
                    resolve(data.access_token)
                })
            } catch (error) {
                reject(error)
            }
        })
    })
}