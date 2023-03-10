import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Spotify from 'spotify-web-api-js';
import { SpotifyConfiguration } from 'src/environments/environment';

import {
  SpotifyArtistaParaArtista,
  SpotifyPlaylistParaPlaylist,
  SpotifyTrackParaMusica,
  SpotifyUserParaUsuario,
} from '../Common/spotifyHelper';
import { IArtista } from '../interfaces/IArtista';
import { IMusica } from '../interfaces/IMusica';
import { IPlaylist } from '../interfaces/IPlaylist';
import { IUsuario } from '../interfaces/IUsuario';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  spotifyApi: Spotify.SpotifyWebApiJs = null;
  usuario: IUsuario;

  constructor(private router: Router) {
    this.spotifyApi = new Spotify();
  }

  async inicializarUsuario() {
    if (!!this.usuario)
      return true;

    const token = localStorage.getItem('token');

    if (!token)
      return false;

    try {

      this.definirAccessToken(token);
      await this.obterSpotifyUusuario();
      return !!this.usuario;

    } catch (ex) {
      return false;
    }
  }

  async obterSpotifyUusuario() {
    const useInfo = await this.spotifyApi.getMe();
    this.usuario = SpotifyUserParaUsuario(useInfo);
  }

  oberUrlLogin() {
    const authEndpoint = `${SpotifyConfiguration.authEndpoint}?`;
    const clientId = `client_id=${SpotifyConfiguration.clientId}&`;
    const redirectUri = `redirect_uri=${SpotifyConfiguration.redirectUrl}&`;
    const scopes = `scope=${SpotifyConfiguration.scopes.join("%20")}&`; /** para concatenar o Array de Strings */
    const responseType = `response_type=token&show_dialog=true`;

    return authEndpoint + clientId + redirectUri + scopes + responseType;
  }

  obterTokenUrlCallback() {
    if (!window.location.hash)
      return '';

    const params = window.location.hash.substring(1).split('&');
    return params[0].split('=')[1];
  }

  definirAccessToken(token: string) {
    this.spotifyApi.setAccessToken(token);
    localStorage.setItem('token', token);
  }

  async buscarPlaylistUsuario(offset = 0, limit = 50): Promise<IPlaylist[]> {
    const playlists = await this.spotifyApi.getUserPlaylists(this.usuario.id, { offset, limit });
    return playlists.items.map(SpotifyPlaylistParaPlaylist);
  }

  async buscarMusicasPlaylist(playlistId: string, offset = 0, limit = 50) {
    const playlistSpotify = await this.spotifyApi.getPlaylist(playlistId);

    if(!playlistSpotify)
      return null;

    const playlist = SpotifyPlaylistParaPlaylist(playlistSpotify);

    const musicasSpotify = await this.spotifyApi.getPlaylistTracks(playlistId, { offset, limit });
    playlist.musicas = musicasSpotify.items.map(x => SpotifyTrackParaMusica(x.track as SpotifyApi.TrackObjectFull));

    return playlist;
  }

  async buscarTopArtistas(limit = 10): Promise<IArtista[]> {
    const artistas = await this.spotifyApi.getMyTopArtists({ limit });
    return artistas.items.map(SpotifyArtistaParaArtista);
  }

  async buscarMusicas(offset = 0, limit = 50): Promise<IMusica[]> {
    const musicas = await this.spotifyApi.getMySavedTracks({ offset, limit });
    return musicas.items.map(x => SpotifyTrackParaMusica(x.track));
  }

  async executarMusica(musicaId: string) {
    await this.spotifyApi.queue(musicaId);
    await this.spotifyApi.skipToNext();
  }

  async obterMusicaAtual(): Promise<IMusica> {
    const musicaSpotify = await this.spotifyApi.getMyCurrentPlaybackState();
    return SpotifyTrackParaMusica(musicaSpotify.item);
  }

  async voltarMusica() {
    await this.spotifyApi.skipToPrevious();
  }

  async proximaMusica() {
    await this.spotifyApi.skipToNext();
  }

  async playMusica(){
    await this.spotifyApi.play();
  }

  async pauseMusica(){
    await this.spotifyApi.pause();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
