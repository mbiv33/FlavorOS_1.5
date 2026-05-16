export interface User {
  id: string;
  /** Full display name including suffix if any ("Test Client"). */
  fullName: string;
  /** First name for greetings. */
  firstName: string;
  /** 2-letter monogram for the avatar. */
  initials: string;
}
