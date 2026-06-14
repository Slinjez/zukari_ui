import { BarChart3, Droplet, Dumbbell, Home, Salad, Settings, Syringe } from 'lucide-react';

export const NAV = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'blood_sugar', icon: Droplet, label: 'Glucose' },
  { id: 'insulin', icon: Syringe, label: 'Insulin' },
  { id: 'meals', icon: Salad, label: 'Food' },
  { id: 'exercise', icon: Dumbbell, label: 'Activity' },
  { id: 'insights', icon: BarChart3, label: 'Reports' },
  { id: 'profile', icon: Settings, label: 'Profile' },
];

export const MEAL_TEMPLATES = [
  { name: 'Githeri', carbs: 45 },
  { name: 'Mbuzi stew', carbs: 8 },
  { name: 'Rice', carbs: 52 },
];
