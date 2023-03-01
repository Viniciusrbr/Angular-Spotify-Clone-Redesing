import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { newMusica } from '../Common/factories';
import { IMusica } from '../interfaces/IMusica';
import { SpotifyService } from './spotify.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  musicaAtual = new BehaviorSubject<IMusica>(newMusica());
  timerId: any = null;

  validatePlayer = new BehaviorSubject<boolean>(true);

  constructor(private spotifyService: SpotifyService) {
    this.obterMusicaAtual();
  }

  async obterMusicaAtual() {
    clearTimeout(this.timerId);

    //Obtenho a música atual
    const musica = await this.spotifyService.obterMusicaAtual();
    this.definirMusicaAtual(musica);

    // Causo loop
    this.timerId = setInterval(async () => {
      await this.obterMusicaAtual();
    }, 3000)
  }

  definirMusicaAtual(musica: IMusica) {
    this.musicaAtual.next(musica);
  }

  async voltarMusica() {
    await this.spotifyService.voltarMusica();
  }

  async proximaMusica() {
    await this.spotifyService.proximaMusica();
  }

  async playMusica(){
    this.validateMusica(false)
    await this.spotifyService.playMusica();
  }

  async pauseMusica(){
    this.validateMusica(true)
    await this.spotifyService.pauseMusica();
  }

 validateMusica(v: boolean){
    this.validatePlayer.next(v);
  }

  async execMusic(id: string){
    this.validateMusica(false)
    await this.spotifyService.executarMusica(id)
  }

}
