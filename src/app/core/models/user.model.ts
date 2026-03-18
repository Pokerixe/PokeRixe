
export enum Role {
  Admin,
  User,
  Guest
}

/** Modèle de données pour un utilisateur
 * - id : Identifiant unique de l'utilisateur
 * - name : Nom de l'utilisateur
 * - email : Adresse e-mail de l'utilisateur
 * - role : Rôle de l'utilisateur (Admin, User, Guest)
 * Modèle d'un utilisateur interne a l'application
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
