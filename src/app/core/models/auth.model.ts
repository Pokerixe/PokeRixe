import {User} from './user.model';

/**
 * DTO (Data Transfer Object) pour les opérations d'authentification.
 * contient les champs de connexion
 * - email : L'adresse e-mail de l'utilisateur.
 * - password : Le mot de passe de l'utilisateur.
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * DTO (Data Transfer Object) pour les opérations d'inscriptions.
 * contient les champs d'inscription
 * - name : Nom de l'utilisateur.
 * - email : L'adresse e-mail de l'utilisateur.
 * - password : Le mot de passe de l'utilisateur.
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

/**
 * DTO (Data Transfer Object) pour la réponse d'authentification.
 * contient les données retournées par le serveur après une opération d'authentification.
 * - user : Les informations de l'utilisateur authentifié (id, name, email, etc.).
 */
export interface AuthResponse {
  user : User;
}
