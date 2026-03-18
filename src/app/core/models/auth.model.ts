

import {User} from './user.model';

/** * DTO (Data Transfer Object) type qu'on utilise pour se connecter, s'inscrire etc...
 * - LoginDTO : Contient les champs nécessaires pour se connecter (email, password)
 * - RegisterDTO : Contient les champs nécessaires pour s'inscrire (name, email, password)
 * - AuthResponse : Contient les données retournées par le serveur après une opération d'authentification (qdqdqd)
 */

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user : User;
}
