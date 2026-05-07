import { PersonaSpecForm } from '@/components/personas/PersonaSpecForm';
import { CANONICAL_PERSONAS } from '@/lib/boardroom/personas';

export default async function PersonaDetailSettingsPage({
  params,
}: {
  params: Promise<{ personaId: string }>;
}) {
  const { personaId } = await params;
  const canonical = CANONICAL_PERSONAS.filter((persona) => persona.id === personaId || persona.id !== personaId);
  return <PersonaSpecForm canonical={canonical} />;
}
