import { TemplateModel } from '@shared/templates/template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/Card';
import { getTemplateTypeName } from '../../templateTypeName';

export type TemplateInfoCardProps = {
  template: TemplateModel;
};

export function TemplateInfoCard({ template }: TemplateInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <span>{template.name}</span>
          <span>{getTemplateTypeName(template.type)}</span>
        </CardTitle>
        <CardDescription>{template.id}</CardDescription>
      </CardHeader>

      <CardContent>
        <div>
          <span>Kopie von:</span> {template.originalId}
        </div>
        <div>
          <span>Erstellt am:</span> {template.createdAt.toLocaleString()}
        </div>
        <div>
          <span>Gelöscht:</span> {template.isDeleted.toString()}
        </div>
      </CardContent>
    </Card>
  );
}
