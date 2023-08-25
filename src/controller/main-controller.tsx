import { Provider } from 'react-redux';
import {
  fetchUserProfile,
  getPlaylistsByQuery, getSpotifyAccessToken,
  getSunCalcData, getWeatherByLocation} from '../services/api-service';
import {
  setLoggedInAction, setSpotifyPlaylistsAction,
  setSunCalcAction, setWeatherAction
} from '../model/actions';
import { buildPlaylistQuery, getMusicalMood } from '../utils/generate-spotify-query';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { store } from '../model/store';

export default class MainController {
  private spotifyToken = localStorage.getItem('spotifyToken') || null;
  private moodData: any;
  private store: any;
  private params = new URLSearchParams(window.location.search);
  private code = this.params.get('code');

  
  constructor(store: any) {
    this.store = store;
    this.updateFromStore();
    
    store.subscribe(() => {
      this.updateFromStore();
    });
  }

  private updateFromStore() {
    const state = this.store.getState();
    this.spotifyToken = state.spotifyToken;
    this.moodData = getMusicalMood(state);
  }

  fetchSpotifyPlaylists = () => {
    if (!this.spotifyToken) return;

    const playlistQuery = buildPlaylistQuery({
      ...this.moodData,
      genres: this.moodData.genres || []
    });

    getPlaylistsByQuery(playlistQuery, this.spotifyToken, this.store.dispatch)
      .then(data => {
          this.store.dispatch(setSpotifyPlaylistsAction(data));
          localStorage.setItem('spotifyPlaylists', JSON.stringify(data));
          console.log('Fetched Spotify playlists for query:', playlistQuery);
      })
      .catch(err => {
          this.handleSpotifyError(err);
      });
  };

  handleSpotifyError = (err: any) => {
    if (err.response) {
      err.response.json().then((errorData: any) => {
        console.error("Detailed Spotify Error:", errorData);
      });
    } else {
      console.error("Error:", err);
    }
  };

  hasValidToken = () => {
    const expiryTime = localStorage.getItem('tokenExpiryTime'); // get the stored expiry time
    if (!expiryTime) return false;
    console.log('EXPIRED?:', new Date().getTime() < parseInt(expiryTime, 10));
    return new Date().getTime() < parseInt(expiryTime, 10);
  };

  userIsLoggedIn = () => {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  handleAccessToken = async (code: any) => {
    try {
      await getSpotifyAccessToken(code, this.store.dispatch);

      if (this.spotifyToken) {
        const tokenExpiryTime = new Date().getTime() + (3600 * 1000);
        localStorage.setItem('tokenExpiryTime', tokenExpiryTime.toString());
        this.store.dispatch(setLoggedInAction(true));
        localStorage.setItem('isLoggedIn', 'true');
        // fetchUserProfile(this.spotifyToken, this.store.dispatch);
        return this.spotifyToken;
      }
    } catch (error) {
      this.handleSpotifyError(error);
    }
    return null;
  };

  init() {
    console.log('MainController init');
    this.fetchWeatherAndSunCalcData();
    if (!this.userIsLoggedIn() && this.hasValidToken()) {
      this.handleAccessToken(this.code);
    }
    this.render();
  }

  fetchWeatherAndSunCalcData = async () => {
    const lat = 40.732542;
    const lon = -73.978773;

    try {
      const weatherData = await getWeatherByLocation(lat, lon);
      this.store.dispatch(setWeatherAction(weatherData)); // Use this.store.dispatch
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }

    try {
      const data = await getSunCalcData(lon, lat);
      this.store.dispatch(setSunCalcAction(data)); // Use this.store.dispatch
    } catch (error) {
      console.error('Failed to fetch SunCalc data:', error);
    }
  };

  render() {
    const root = createRoot(document.getElementById('root') as HTMLElement);
    root.render(
    <Provider store={store}>
      <App />
    </Provider>);
  }
};