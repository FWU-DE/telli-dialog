'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@ui/components/Button';
import { getTemplatesAction } from './actions';
import { TemplateModel } from '@telli/shared/services/templateService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';

function getTypeName(type: string) {
  switch (type) {
    case 'character':
      return 'Dialogpartner';
    case 'custom-gpt':
      return 'Assistent';
    default:
      return 'Unbekannt';
  }
}

export default function TemplateListView() {
  const [templates, setTemplates] = useState<TemplateModel[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    startTransition(async () => {
      const templates = await getTemplatesAction();
      setTemplates(templates);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vorlagen</CardTitle>
        <CardDescription>
          Liste aller globalen Vorlagen, sowohl Dialogpartner als auch Assistenten.
        </CardDescription>
        <CardAction>
          <Button disabled={isPending} onClick={loadTemplates}>
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Id</TableHead>
              <TableHead className="w-[300px]">Original Id</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead>Gelöscht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.id}</TableCell>
                <TableCell>{template.originalId}</TableCell>
                <TableCell>{getTypeName(template.type)}</TableCell>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.createdAt.toLocaleString()}</TableCell>
                <TableCell>{template.isDeleted ? 'ja' : 'nein'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
