'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@ui/components/Button';
import { getTemplatesAction } from './actions';
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
import { ROUTES } from '@/consts/routes';
import Link from 'next/link';
import { TemplateModel } from '@shared/models/templates';
import { Search } from 'lucide-react';
import { getTemplateTypeName } from './templateTypeName';
import { CreateTemplateModal } from './CreateTemplateModal';

export default function TemplateListView() {
  const [templates, setTemplates] = useState<TemplateModel[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    startTransition(async () => {
      const templates = await getTemplatesAction();
      setTemplates(templates);
    });
  };

  const handleNewTemplate = () => {
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Reload templates after successful creation
    loadTemplates();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Vorlagen</CardTitle>
          <CardDescription>
            Liste aller globalen Vorlagen, sowohl Dialogpartner als auch Assistenten.
          </CardDescription>
          <CardAction>
            <Button onClick={handleNewTemplate}>Neue Vorlage</Button>
            <Button disabled={isPending} onClick={loadTemplates} className="ml-2">
              Aktualisieren
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.id}</TableCell>
                  <TableCell>{template.originalId}</TableCell>
                  <TableCell>{getTemplateTypeName(template.type)}</TableCell>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.createdAt.toLocaleString()}</TableCell>
                  <TableCell>{template.isDeleted ? 'ja' : 'nein'}</TableCell>
                  <TableCell>
                    <Link href={ROUTES.dialog.template(template.type, template.id)}>
                      <Search className="text-primary" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
