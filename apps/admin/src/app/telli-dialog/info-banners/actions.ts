'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getFederalStates } from '@shared/federal-states/federal-state-service';
import {
  createInfoBanner,
  deleteInfoBanner,
  getFederalStatesWithInfoBannerMappings,
  getInfoBannerById,
  getInfoBanners,
  updateInfoBanner,
} from '@shared/info-banners/info-banner-service';
import type {
  InfoBannerToFederalStateMapping,
  ManageInfoBannerInput,
} from '@shared/info-banners/info-banner';

export async function getInfoBannersAction() {
  await requireAdminAuth();

  return getInfoBanners();
}

export async function getInfoBannerByIdAction(infoBannerId: string) {
  await requireAdminAuth();

  return getInfoBannerById(infoBannerId);
}

export async function getFederalStatesAction() {
  await requireAdminAuth();

  return getFederalStates();
}

export async function getFederalStatesWithInfoBannerMappingsAction(infoBannerId: string) {
  await requireAdminAuth();

  return getFederalStatesWithInfoBannerMappings(infoBannerId);
}

export async function createInfoBannerAction(
  input: ManageInfoBannerInput,
  mappings: InfoBannerToFederalStateMapping[],
) {
  await requireAdminAuth();

  return createInfoBanner(input, mappings);
}

export async function updateInfoBannerAction(
  infoBannerId: string,
  input: ManageInfoBannerInput,
  mappings: InfoBannerToFederalStateMapping[],
) {
  await requireAdminAuth();

  return updateInfoBanner(infoBannerId, input, mappings);
}

export async function deleteInfoBannerAction(infoBannerId: string) {
  await requireAdminAuth();

  return deleteInfoBanner(infoBannerId);
}
