import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playSpotifyPlaylist } from '../services/spotify-service';
import { AppState } from '../model/state';
import { setSpotifyPlaylistsAction } from '../model/actions';
import { FaPlay } from 'react-icons/fa';
import { SpotifyPlayer } from '../component/SpotifyPlayer';
import SpaceBackground from '../component/Space';
import './Browse.css';

const Browse: React.FC = () => {
  const dispatch = useDispatch();
  const playlists = useSelector((state: AppState) => state.spotifyPlaylists);
  const accessToken = localStorage.getItem('spotifyToken');
  const [playlistPlayed, setPlaylistPlayed] = useState(false);

  const playPlaylist = (playlistURI: string) => {
    if (accessToken) {
      playSpotifyPlaylist(playlistURI, accessToken)
        .then(() => {
          console.log("Playing playlist:", playlistURI);
          setPlaylistPlayed(prev => !prev); // Toggle the state
        })
        .catch(error => {
          console.error("Error playing playlist:", error);
        });
    } else {
      console.error("Access token is not available.");
    }
  };

  useEffect(() => {
    // On component load, check localStorage
    const storedPlaylists = localStorage.getItem('spotifyPlaylists');
    if (storedPlaylists) {
      // If playlists exist in localStorage, dispatch them to Redux
      dispatch(setSpotifyPlaylistsAction(JSON.parse(storedPlaylists)));
    }
  }, [dispatch]);

  useEffect(() => {
    // When playlists change, update localStorage
    if (Array.isArray(playlists)) {
      localStorage.setItem('spotifyPlaylists', JSON.stringify(playlists));
    }
  }, [playlists]);

  return (
    <>
    <div className="space-background">
      <SpaceBackground />
    </div>

    <div className='browse-grid'>
      <div className="row four">
      {Array.isArray(playlists) && playlists.map((playlist: any) => (
        <div className="column" key={playlist.id}>
          <div 
            onClick={() => playPlaylist(playlist.uri)}
            className='album-art'
            style={{
              backgroundImage: `url(${playlist?.images?.[0]?.url})`,
            }}
          >
            <div className="playback-controls">
                <button className='play-circle'>
                  <FaPlay size={25} color='#202020' />
                </button>
                <h2 className='playlist-title'>{playlist?.name}</h2>
            </div>
          </div>
        </div>
      ))}
      </div>
      {accessToken && <SpotifyPlayer accessToken={accessToken} playlistPlayed={playlistPlayed} />}
    </div>
    </>
  );
};

export default Browse;

