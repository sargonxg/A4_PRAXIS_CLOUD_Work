import { PersonaSpecForm } from '@/components/personas/PersonaSpecForm';
import { CANONICAL_PERSONAS } from '@/lib/boardroom/personas';

export default function NewPersonaSettingsPage() {
  return <PersonaSpecForm canonical={CANONICAL_PERSONAS} />;
}
