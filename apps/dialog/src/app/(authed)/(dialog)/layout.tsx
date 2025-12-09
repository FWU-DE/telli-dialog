import { SidebarVisibilityProvider } from '@/components/navigation/sidebar/sidebar-provider';
import { getUser, userHasCompletedTraining } from '@/auth/utils';
import React from 'react';
import DialogSidebar from './sidebar';
import { HEADER_PORTAL_ID } from './header-portal';
import { contentHeight } from '@/utils/tailwind/height';
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

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('errors');
  const user = await getUser();
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
    <div className="flex h-[100dvh] w-[100dvw]">
      <FederalStateProvider federalState={federalState}>
        <SidebarVisibilityProvider>
          <LlmModelsProvider
            models={models}
            defaultLlmModelByCookie={user.lastUsedModel ?? DEFAULT_CHAT_MODEL}
          >
            <DialogSidebar
              user={user}
              currentModelCosts={priceInCent ?? 0}
              userPriceLimit={userPriceLimit ?? 500}
            />
            <div className="flex flex-col max-h-[100dvh] min-h-[100dvh] w-full overflow-auto">
              <div
                id={HEADER_PORTAL_ID}
                className="sticky z-10 top-0 py-4 h-[4.75rem] px-6 flex gap-4 items-center justify-between bg-white"
                style={{
                  position: '-webkit-sticky',
                }}
              ></div>
              <div className={contentHeight}>{children}</div>
            </div>
          </LlmModelsProvider>
        </SidebarVisibilityProvider>
        {!productAccess.hasAccess && (
          <ProductAccessModal modalTitle={'Nutzung nicht möglich'}>
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
    </div>
  );
}
