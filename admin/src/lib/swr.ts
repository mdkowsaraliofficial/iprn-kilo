import type { SWRConfiguration } from "swr";

export const adminSwr: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
};
