import {
  type QueryKey,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";

type PollingOptions<TQueryFnData, TError, TData> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
  "queryKey"
> & {
  queryKey: QueryKey;
  pollMs?: number;
};

export function usePollingQuery<TQueryFnData, TError = Error, TData = TQueryFnData>(
  options: PollingOptions<TQueryFnData, TError, TData>
) {
  const { pollMs = 20_000, ...queryOptions } = options;

  return useQuery({
    ...queryOptions,
    refetchInterval: pollMs,
    queryKey: options.queryKey,
  });
}
