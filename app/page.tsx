import { redirect } from 'next/navigation';

export default function Home() {
  // SafeTrace defaults to the calculator disguise page
  redirect('/calculator');
}
