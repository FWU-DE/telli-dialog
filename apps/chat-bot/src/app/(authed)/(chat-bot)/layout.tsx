import { getUser, userHasCompletedTraining } from '@/auth/utils';
import React from 'react';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { checkProductAccess } from '@/utils/vidis/access';
import ProductAccessModal from '@/components/modals/product-access';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import TermsConditionsModal from '@/components/modals/terms-conditions-initial';
import { federalStateDisclaimers, VERSION } from '@/components/modals/const';
import { setUserAcceptConditions } from './actions';
import { FederalStateId } from '@/utils/vidis/const';
import { getTranslations } from 'next-intl/server';
import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import { FederalStateProvider } from '@/components/providers/federal-state-provider';
import AppSidebar from '@/components/navigation/sidebar/app-sidebar';
import { SidebarProvider } from '@ais-chat/ui/components/sidebar';
import SessionWatcher from '@/auth/SessionWatcher';
import { getActiveBannersForUser } from '@shared/info-banners/info-banner-service';
import { ApplicationLayout } from '@/components/layout/application-layout';
import {
  getMaxBudgetInCentByUser,
  getUsedBudgetInCentByUser,
} from '@shared/users/user-budget-service';

export const dynamic = 'force-dynamic';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('errors');
  const user = await getUser();
  if (!user.federalState.hasApiKeyAssigned) throw new Error(t('no-api-key'));

  const [federalState, models, usedBudget, maxBudget, hasCompletedTraining, activeBanners] =
    await Promise.all([
      getFederalStateById(user.federalState.id),
      dbGetLlmModelsByFederalStateId({ federalStateId: user.federalState.id }),
      getUsedBudgetInCentByUser({ user }),
      getMaxBudgetInCentByUser({ user, federalState: user.federalState }),
      userHasCompletedTraining(),
      getActiveBannersForUser({
        federalStateId: user.federalState.id,
        userId: user.id,
      }),
    ]);

  const productAccess = checkProductAccess({ ...user, hasCompletedTraining });
  const userAndContext = {
    ...user,
    userRole: user.userRole,
    federalState,
  };
  const federalStateDisclaimer =
    federalStateDisclaimers[(user.federalStateId ?? user.federalState.id) as FederalStateId];
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
              user={user}
              federalState={federalState}
              usedBudget={usedBudget ?? 0}
              maxBudget={maxBudget ?? 500}
            />
            <ApplicationLayout userAndContext={userAndContext} infoBanners={activeBanners}>
              {children}
            </ApplicationLayout>
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
