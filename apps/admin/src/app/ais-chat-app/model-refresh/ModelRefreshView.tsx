import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';

export default function ModelRefreshView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LLM-Modelle automatisch aktualisieren</CardTitle>
          <CardDescription>
            Änderungen an Modellen und Zuweisungen werden nach dem Speichern automatisch in AIS.chat
            übernommen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Die Synchronisierung läuft im Hintergrund direkt nach dem Speichern der Modell- oder
            Zuordnungsdaten. Ein manueller Refresh ist nicht mehr erforderlich.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
