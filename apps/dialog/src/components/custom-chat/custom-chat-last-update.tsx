export type CustomChatLastUpdateProps = {
  date: Date;
};

export function CustomChatLastUpdate({ date }: CustomChatLastUpdateProps) {
  return (
    <div className="ml-auto">
      <div className="text-center text-xs text-foreground/70">Letzte Aktualisierung</div>
      <div className="text-center text-sm text-foreground whitespace-pre">
        {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        {'  |  '}
        {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
