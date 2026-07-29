'use client';

import { startTransition, useEffect, useState } from 'react';
import {
  getUrlPresetsAction,
  insertUrlPresetAction,
  deleteUrlPresetAction,
  updateUrlPresetAction,
} from './actions';
import { UrlPreset, UrlPresetInsert, UrlPresetUpdate } from '@shared/web-search/url-presets/types';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Separator } from '@ui/components/separator';
import { AddUrlToPresetForm } from './AddUrlToPresetForm';
import { Chip } from '@ui/components/chip';
import { TrashSimpleIcon } from '@phosphor-icons/react';
import { CreateNewUrlPreset } from './CreateNewUrlPreset';
import { EditUrlPresetForm } from './EditUrlPresetForm';

export function UrlPresetsListView() {
  const [urlPresets, setUrlPresets] = useState<UrlPreset[]>([]);

  const loadUrlPresets = async () => {
    startTransition(async () => {
      const urlPresets = await getUrlPresetsAction();
      setUrlPresets(urlPresets);
    });
  };

  useEffect(() => {
    void loadUrlPresets();
  }, []);

  async function handleNewUrlPreset(): Promise<void> {
    const newUrlPreset: UrlPresetInsert = {
      name: `Neues Webseitenpaket (${urlPresets.length + 1})`,
      orderNumber: urlPresets.length + 1,
      urls: [],
    };
    const insertedUrlPreset = await insertUrlPresetAction(newUrlPreset);
    setUrlPresets((prev) => [...prev, insertedUrlPreset]);
  }

  async function handleDeleteUrlPreset(id: string): Promise<void> {
    await deleteUrlPresetAction(id);
    setUrlPresets((prev) => prev.filter((preset) => preset.id !== id));
  }

  async function handleAddUrlToPreset(presetId: string, url: string): Promise<void> {
    const preset = urlPresets.find((preset) => preset.id === presetId);
    if (!preset) return;

    const presetData: UrlPresetUpdate = {
      ...preset,
      urls: [...preset.urls, url],
    };
    const updatedPreset = await updateUrlPresetAction(presetId, presetData);
    setUrlPresets((prev) => prev.map((p) => (p.id === presetId ? updatedPreset : p)));
  }

  async function handleDeleteUrlFromPreset(presetId: string, url: string): Promise<void> {
    const preset = urlPresets.find((preset) => preset.id === presetId);
    if (!preset) return;

    const presetData: UrlPresetUpdate = {
      ...preset,
      urls: preset.urls.filter((u) => u !== url),
    };
    const updatedPreset = await updateUrlPresetAction(presetId, presetData);
    setUrlPresets((prev) => prev.map((p) => (p.id === presetId ? updatedPreset : p)));
  }

  async function handleUpdateUrlPreset(
    presetId: string,
    name: string,
    orderNumber: number,
  ): Promise<void> {
    const preset = urlPresets.find((preset) => preset.id === presetId);
    if (!preset) return;

    const presetData: UrlPresetUpdate = {
      ...preset,
      name,
      orderNumber,
    };
    const updatedPreset = await updateUrlPresetAction(presetId, presetData);
    setUrlPresets((prev) => prev.map((p) => (p.id === presetId ? updatedPreset : p)));
  }

  return (
    <div className="flex flex-col gap-4">
      <CreateNewUrlPreset onCreate={handleNewUrlPreset} />
      {urlPresets
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .map((preset) => (
          <Card key={preset.id} className="bg-gray-100">
            <CardHeader>
              <CardTitle>
                <EditUrlPresetForm
                  currentName={preset.name}
                  existingNames={urlPresets.filter((p) => p.id !== preset.id).map((p) => p.name)}
                  currentOrderNumber={preset.orderNumber}
                  onUpdate={({ name, orderNumber }) =>
                    handleUpdateUrlPreset(preset.id, name, orderNumber)
                  }
                />
              </CardTitle>
              <CardAction>
                <Button variant="destructive" onClick={() => handleDeleteUrlPreset(preset.id)}>
                  <TrashSimpleIcon />
                  Delete
                </Button>
              </CardAction>
            </CardHeader>
            <Separator className="mx-2" />
            <CardContent className="flex flex-col gap-2">
              <div>Webseiten</div>
              <div className="flex flex-row flex-wrap gap-2">
                {preset.urls
                  .sort((a, b) => a.localeCompare(b))
                  .map((url, index) => (
                    <Chip key={`url_${index}`}>
                      {url}
                      <Button
                        onClick={() => handleDeleteUrlFromPreset(preset.id, url)}
                        variant="ghost"
                        size="icon-sm"
                      >
                        <TrashSimpleIcon data-icon="inline-end" />
                      </Button>
                    </Chip>
                  ))}
              </div>
            </CardContent>
            <Separator className="mx-2" />
            <CardFooter>
              <AddUrlToPresetForm
                existingUrls={preset.urls}
                onAdd={(url) => handleAddUrlToPreset(preset.id, url)}
              />
            </CardFooter>
          </Card>
        ))}
    </div>
  );
}
