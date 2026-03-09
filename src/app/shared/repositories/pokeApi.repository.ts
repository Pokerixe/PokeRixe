import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PokemonListDTO} from '../models/dto/pokemon-list.dto';
import {RawPokemonDTO} from '../models/dto/pokemon.dto';

@Injectable({ providedIn: 'root' })
export class PokemonRepository {
  private readonly BASE = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  getList(limit = 150): Observable<PokemonListDTO> {
    return this.http.get<PokemonListDTO>(`${this.BASE}/pokemon?limit=${limit}`);
  }

  getByUrl(url: string): Observable<RawPokemonDTO> {
    return this.http.get<RawPokemonDTO>(url);
  }

  //getSpecies(id: number): Observable<RawSpeciesDTO> {
  //  return this.http.get<RawSpeciesDTO>(`${this.BASE}/pokemon-species/${id}`);
  //}
}
