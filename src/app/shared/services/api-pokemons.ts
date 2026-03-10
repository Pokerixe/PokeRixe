import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class ApiPokemons {

  private apiUrl = 'https://pokebuildapi.fr/api/v1';
  //private apiUrl = 'https://pokeapi.co/api/v2/';

  constructor(private http: HttpClient) {}

  getPokedex(): Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/pokemon/generation/1`).pipe(
    //return this.http.get<any>(`${this.apiUrl}/pokemon?limit=151`).pipe(
      catchError(this.handleError)
    );
  }

  getPokemon(id: string): Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/pokemon/${id}`).pipe(
      catchError(this.handleError)
    )
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = "Une erreur est survenue";
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur ${error.error.message}`;
    } else {
      errorMessage = `Code : ${error.error.code}, Message : ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(()=> new Error(errorMessage));
  }
}
