// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Home() {
  return (
    <div>
      <div>Willkommen bei AIS.chat-admin.</div>
      <span>
        Benutzen Sie die Navigation im Header um AIS.chat-api bzw. AIS.chat-app zu konfigurieren.
      </span>
    </div>
  );
}
