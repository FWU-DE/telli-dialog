import { AssistantSelectModel } from '@shared/db/schema';

export function AssistantView({ assistant }: { assistant: AssistantSelectModel }) {
  return (
    <div>
      <h1>View Ansicht von {assistant.name}</h1>
    </div>
  );
}
