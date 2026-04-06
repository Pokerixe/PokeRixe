/**
 * Niveaux de permission dans l'application.
 *
 * - `Admin` (2) : accès complet, y compris la page d'administration
 * - `User` (1) : utilisateur connecté standard
 * - `Guest` (0) : accès minimal (non connecté)
 *
 * La priorité est gérée dans `roleGuard` via une map de valeurs numériques.
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
