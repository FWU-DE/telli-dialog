import { SidebarVisibilityProvider } from '@/components/navigation/sidebar/sidebar-provider';
import { getUser } from '@/auth/utils';
import React from 'react';
import DialogSidebar from './sidebar';
import { HEADER_PORTAL_ID } from './header-portal';
import { contentHeight } from '@/utils/tailwind/height';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@/db/functions/llm-model';
import { getPriceInCentByUser } from '@/app/school';
import AutoLogout from '@/components/auth/auto-logout';
import { checkProductAccess } from '@/utils/vidis/access';
import ProductAccessModal from '@/components/modals/product-access';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';

export const dynamic = 'force-dynamic';
import TermsConditionsModal from '@/components/modals/terms-conditions-initial';
import { federalStateDisclaimers, VERSION } from '@/components/modals/const';
import { setUserAcceptConditions } from './actions';
import { FederalStateId } from '@/utils/vidis/const';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const priceInCent = await getPriceInCentByUser({ user, models });
  const productAccess = checkProductAccess(user);
  const federalStateDisclaimer =
    federalStateDisclaimers[user.school.federalStateId as FederalStateId];
  const userMustAccept =
    federalStateDisclaimer !== undefined &&
    (user.versionAcceptedConditions === null || user.versionAcceptedConditions < VERSION);

  return (
    <div className="flex h-[100dvh] w-[100dvw]">
      <AutoLogout />
      <SidebarVisibilityProvider>
        <LlmModelsProvider
          models={models}
          defaultLlmModelByCookie={user.lastUsedModel ?? DEFAULT_CHAT_MODEL}
        >
          <DialogSidebar user={user} currentModelCosts={priceInCent ?? 0} />
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
    </div>
  );
}
