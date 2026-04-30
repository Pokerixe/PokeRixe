import { TeamDto } from "../team/team.dto";

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

export interface User {
  mail: string;
  password: string;
  id: string;
  pseudo: string;
  role: Role;
  roles: Role[];
  team: TeamDto;
}

