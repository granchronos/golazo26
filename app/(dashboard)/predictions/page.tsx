import { redirect } from 'next/navigation'

// Predictions are now made inside rooms — redirect to groups
export default function PredictionsPage() {
  redirect('/groups')
}
