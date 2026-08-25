export interface PlayerInput {
  // Null means the player has gone, which is not the same as typing nothing.
  ask(): Promise<string | null>;
}
