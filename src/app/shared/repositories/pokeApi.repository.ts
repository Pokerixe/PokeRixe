import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PokemonListDTO} from '../models/dto/pokemon-list.dto';
import {RawPokemonDTO} from '../models/dto/pokemon.dto';

/**
 * Repository pour accéder à l'API pokeApi
 * Permet de récupérer la liste des pokemons, les détails d'un pokemon par son id ou par son url
 * Exemple d'utilisation : dans un service, injecter ce repository et appeler les méthodes pour récupérer les données de l'API
 */
@Injectable({ providedIn: 'root' })
export class PokemonRepository {
  private readonly BASE = 'https://pokeapi.co/api/v2';

  constructor(private readonly http: HttpClient) {}

  getList(limit = 150): Observable<PokemonListDTO> {
    return this.http.get<PokemonListDTO>(`${this.BASE}/pokemon?limit=${limit}`);
  }

  getById(id: number): Observable<RawPokemonDTO> {
    return this.http.get<RawPokemonDTO>(`${this.BASE}/pokemon/${id}`);
  }

  getByUrl(url: string): Observable<RawPokemonDTO> {
    return this.http.get<RawPokemonDTO>(url);
  }

  getSpecies(id: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/pokemon-species/${id}`);
  }
}
