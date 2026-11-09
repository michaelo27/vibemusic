import { CreateJarForm } from '@/components/create-jar-form';
import { SectionHeading } from '@/components/ui/card';

export const metadata = {
  title: 'Create your tip jar',
  description: 'Link up to three Audius tracks and start receiving $VIBES on Base.',
};

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow="step 1 of 1"
        title="Create your tip jar"
        description="Link your Audius tracks. Your handle becomes discoverable by fans — and by the VibeMusic agent, which tips artists autonomously in $VIBES."
        className="mb-7 max-w-2xl"
      />
      <CreateJarForm />
    </div>
  );
}
