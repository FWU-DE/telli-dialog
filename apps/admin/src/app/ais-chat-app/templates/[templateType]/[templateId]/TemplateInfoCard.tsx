import { TemplateModel, TemplateTypes } from '@shared/templates/template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { SimpleInputDialog } from '@ui/components/simple-input-dialog';
import { getTemplateTypeName } from '../../templateTypeName';
import { Checkbox } from '@ui/components/checkbox';
import { EditIcon } from 'lucide-react';
import { Button } from '@ui/components/button';
import React from 'react';
import { Input } from '@ui/components/input';
import { updateAuthorOfTemplateAction } from './actions';
import { toast } from 'sonner';

export type TemplateInfoCardProps = {
  template: TemplateModel;
  onDataChanged: () => void;
};

export function TemplateInfoCard({ template, onDataChanged }: TemplateInfoCardProps) {
  async function handleSubmitOfAuthorChange(
    templateId: string,
    templateType: TemplateTypes,
    newAuthor: string,
  ) {
    try {
      await updateAuthorOfTemplateAction(templateType, templateId, newAuthor);
      onDataChanged();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Autors.', {
        description: (error as Error).message,
      });
    }
  }

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
          <span className="inline-block w-24 font-semibold">Kopie von:</span> {template.originalId}
        </div>
        <div>
          <span className="inline-block w-24 font-semibold">Erstellt am:</span>
          {template.createdAt.toLocaleString()}
        </div>
        <div>
          <span className="inline-block w-24 font-semibold">Gelöscht:</span>
          <Checkbox checked={template.isDeleted} disabled className="inline" />
        </div>
        <div className="flex items-center">
          <span className="inline-block w-24 font-semibold">Autor:</span>
          {!template.author ? (
            <span className="text-muted-foreground">nicht gesetzt</span>
          ) : (
            template.author
          )}
          <SimpleInputDialog
            title="Name des Autors"
            description="Geben Sie den Namen des Autors ein."
            initialValues={{ author: template.author ?? '' }}
            content={(values, onChange) => (
              <Input
                type="text"
                value={values.author}
                onChange={(e) => onChange({ ...values, author: e.target.value })}
              />
            )}
            trigger={
              <Button variant="ghost" size="icon-sm" className="ml-2">
                <EditIcon />
              </Button>
            }
            onSubmit={async (values) => {
              await handleSubmitOfAuthorChange(template.id, template.type, values.author);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
