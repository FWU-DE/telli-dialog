'use client';

import { startTransition, useEffect, useState } from 'react';
import {
  getUrlPresetsAction,
  insertUrlPresetAction,
  deleteUrlPresetAction,
  updateUrlPresetAction,
} from './actions';
import {
  UrlPreset,
  UrlPresetInsert,
  UrlPresetUpdate,
  urlPresetUpdateSchema,
} from '@shared/web-search/url-presets/types';
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
import { toast } from 'sonner';

export function UrlPresetsListView() {
  const [urlPresets, setUrlPresets] = useState<UrlPreset[]>([]);

  const loadUrlPresets = async () => {
    startTransition(async () => {
      const result = await getUrlPresetsAction();
      if (result.success) {
        setUrlPresets(result.value);
      } else {
        toast.error(result.error.message);
        setUrlPresets([]);
      }
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
    const result = await insertUrlPresetAction(newUrlPreset);
    if (result.success) {
      setUrlPresets((prev) => [...prev, result.value]);
    } else {
      toast.error(result.error.message);
      await loadUrlPresets();
    }
  }

  async function handleDeleteUrlPreset(id: string): Promise<void> {
    const result = await deleteUrlPresetAction(id);
    if (result.success) {
      setUrlPresets((prev) => prev.filter((preset) => preset.id !== id));
    } else {
      toast.error(result.error.message);
      await loadUrlPresets();
    }
  }

  async function handleAddUrlToPreset(presetId: string, url: string): Promise<void> {
    const preset = urlPresets.find((preset) => preset.id === presetId);
    if (!preset) return;

    const presetData: UrlPresetUpdate = {
      ...urlPresetUpdateSchema.parse(preset),
      urls: [...preset.urls, url],
    };
    const updatedPreset = await updateUrlPresetAction(presetId, presetData);
    if (updatedPreset.success) {
      setUrlPresets((prev) => prev.map((p) => (p.id === presetId ? updatedPreset.value : p)));
    } else {
      toast.error(updatedPreset.error.message);
      await loadUrlPresets();
    }
  }

  async function handleDeleteUrlFromPreset(presetId: string, url: string): Promise<void> {
    const preset = urlPresets.find((preset) => preset.id === presetId);
    if (!preset) return;

    const presetData: UrlPresetUpdate = {
      ...urlPresetUpdateSchema.parse(preset),
      urls: preset.urls.filter((u) => u !== url),
    };
    const result = await updateUrlPresetAction(presetId, presetData);
    if (result.success) {
      setUrlPresets((prev) => prev.map((p) => (p.id === presetId ? result.value : p)));
    } else {
      toast.error(result.error.message);
      await loadUrlPresets();
    }
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
    const result = await updateUrlPresetAction(presetId, presetData);
    if (result.success) {
      setUrlPresets((prev) => prev.map((p) => (p.id === presetId ? result.value : p)));
    } else {
      toast.error(result.error.message);
      await loadUrlPresets();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <CreateNewUrlPreset onCreate={handleNewUrlPreset} />
      {urlPresets
        .toSorted((a, b) => a.orderNumber - b.orderNumber)
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
                  Löschen
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div>Webseiten</div>
              <div className="flex flex-row flex-wrap gap-2">
                {preset.urls
                  .toSorted((a, b) => a.localeCompare(b))
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
