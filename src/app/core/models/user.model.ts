
/** * Enumération des rôles d'utilisateur
 * - Admin : Utilisateur avec tous les droits
 * - User : Utilisateur standard avec des droits limités
 * - Guest : Utilisateur invité avec des droits très limités
 */
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
