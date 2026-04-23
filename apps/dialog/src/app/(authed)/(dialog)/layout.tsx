import { getUser, userHasCompletedTraining } from '@/auth/utils';
import React from 'react';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { getPriceInCentByUser, getPriceLimitInCentByUser } from '@/app/school';
import { checkProductAccess } from '@/utils/vidis/access';
import ProductAccessModal from '@/components/modals/product-access';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';

export const dynamic = 'force-dynamic';
import TermsConditionsModal from '@/components/modals/terms-conditions-initial';
import { federalStateDisclaimers, VERSION } from '@/components/modals/const';
import { setUserAcceptConditions } from './actions';
import { FederalStateId } from '@/utils/vidis/const';
import { getTranslations } from 'next-intl/server';
import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import { FederalStateProvider } from '@/components/providers/federal-state-provider';
import AppSidebar from '@/components/navigation/sidebar/app-sidebar';
import { SidebarProvider } from '@telli/ui/components/Sidebar';
import SessionWatcher from '@/auth/SessionWatcher';
import { DialogHeader, DialogHeaderProvider } from '@/components/layout/dialog-header';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('errors');
  const user = await getUser();
  const userWithRole = { ...user, userRole: user.school.userRole };
  if (!user.hasApiKeyAssigned) throw new Error(t('no-api-key'));

  const [federalState, models, priceInCent, userPriceLimit, hasCompletedTraining] =
    await Promise.all([
      getFederalStateById(user.federalState.id),
      dbGetLlmModelsByFederalStateId({ federalStateId: user.federalState.id }),
      getPriceInCentByUser(user),
      getPriceLimitInCentByUser(user),
      userHasCompletedTraining(),
    ]);

  const productAccess = checkProductAccess({ ...user, hasCompletedTraining });
  const federalStateDisclaimer =
    federalStateDisclaimers[user.school.federalStateId as FederalStateId];
  const userMustAccept =
    federalStateDisclaimer !== undefined &&
    (user.versionAcceptedConditions === null || user.versionAcceptedConditions < VERSION);

  return (
    <SessionWatcher redirectTo="/api/auth/logout-callback">
      <FederalStateProvider federalState={federalState}>
        <SidebarProvider className="min-h-0">
          <LlmModelsProvider
            models={models}
            defaultLlmModelByCookie={user.lastUsedModel ?? DEFAULT_CHAT_MODEL}
          >
            <AppSidebar
              user={userWithRole}
              federalState={federalState}
              currentModelCosts={priceInCent ?? 0}
              userPriceLimit={userPriceLimit ?? 500}
            />
            <DialogHeaderProvider>
              <div className="relative flex flex-col h-dvh w-dvw overflow-hidden bg-background-2">
                <DialogHeader />
                <main className="min-h-0 w-full mx-auto flex-1 overflow-auto">{children}</main>
              </div>
            </DialogHeaderProvider>
          </LlmModelsProvider>
        </SidebarProvider>
        {!productAccess.hasAccess && (
          <ProductAccessModal modalTitle="Nutzung nicht möglich">
            {productAccess.errorMessage}
          </ProductAccessModal>
        )}
        {userMustAccept ? (
          <TermsConditionsModal
            handleAccept={setUserAcceptConditions}
            disclaimerConfig={federalStateDisclaimer}
          ></TermsConditionsModal>
        ) : null}
      </FederalStateProvider>
    </SessionWatcher>
  );
}
