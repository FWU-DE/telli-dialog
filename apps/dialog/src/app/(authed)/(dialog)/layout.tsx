import { getUser, userHasCompletedTraining } from '@/auth/utils';
import React from 'react';
import { HEADER_PORTAL_ID } from './header-portal';
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
import { getActiveBannersForUser } from '@shared/info-banners/info-banner-service';
import ActiveInfoBanners from '@/components/info-banners/active-info-banners';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('errors');
  const user = await getUser();
  const userWithRole = {
    ...user,
    userRole: user.userRole,
    federalStateId: user.federalStateId ?? undefined,
  };
  if (!user.federalState.hasApiKeyAssigned) throw new Error(t('no-api-key'));

  const [federalState, models, priceInCent, userPriceLimit, hasCompletedTraining, activeBanners] =
    await Promise.all([
      getFederalStateById(user.federalState.id),
      dbGetLlmModelsByFederalStateId({ federalStateId: user.federalState.id }),
      getPriceInCentByUser(user),
      getPriceLimitInCentByUser(user),
      userHasCompletedTraining(),
      getActiveBannersForUser({
        federalStateId: user.federalState.id,
        userId: user.id,
      }),
    ]);

  const productAccess = checkProductAccess({ ...user, hasCompletedTraining });
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
              user={userWithRole}
              federalState={federalState}
              currentModelCosts={priceInCent ?? 0}
              userPriceLimit={userPriceLimit ?? 500}
            />
            <div className="relative flex flex-col h-dvh w-dvw overflow-hidden bg-background-2">
              <ActiveInfoBanners infoBanners={activeBanners} />
              {/* Todo: Refactor HeaderPortal and header components to not rely on style of this div */}
              <header
                id={HEADER_PORTAL_ID}
                className="h-19 flex-none px-6 py-4 flex items-center justify-between gap-4"
              ></header>
              <main className="min-h-0 w-full mx-auto flex-1 overflow-auto">{children}</main>
            </div>
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
