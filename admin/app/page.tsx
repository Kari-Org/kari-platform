import { redirect } from 'next/navigation';

export default function Home() {
  // The shell + auth gate land in A0.4; for now the root sends you to the dashboard.
  redirect('/dashboard');
}
