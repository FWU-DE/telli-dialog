import { CustomGptSelectModel } from '@shared/db/schema';

export function AssistantView({ assistant }: { assistant: CustomGptSelectModel }) {
  return (
    <div>
      <h1>View Ansicht von {assistant.name}</h1>
    </div>
  );
}
