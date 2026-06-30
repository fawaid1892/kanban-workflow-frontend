import { redirect } from 'next/navigation';

export default function RolesPage() {
  // Roles are now built into the workflow editor as node types.
  // No separate role management needed.
  redirect('/workflows');
}