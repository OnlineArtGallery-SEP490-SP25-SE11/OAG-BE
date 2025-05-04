import { ErrorCode } from "@/constants/error-code";
import { BadRequestException } from "@/exceptions/http-exception";

interface ParseOptions {
    defaultSort?: Record<string, number>;
    defaultLimit?: number;
    defaultPage?: number;
    forceFilters?: Record<string, any>;
}

export class ParseQueryOptions {
    static parse<T>(query: any, options: ParseOptions = {}): T {
        const {
            defaultSort = { createdAt: -1 },
            defaultLimit = 10,
            defaultPage = 1,
            forceFilters = {}
        } = options;

        try {
            return {
                page: parseInt(query.page as string) || defaultPage,
                limit: parseInt(query.limit as string) || defaultLimit,
                sort: query.sort ? JSON.parse(query.sort as string) : defaultSort,
                filter: {
                    ...(query.filter ? JSON.parse(query.filter as string) : {}),
                    ...forceFilters
                },
                search: query.search as string,
                ...forceFilters
            } as T;
        } catch {
            throw new BadRequestException(
                'Invalid query parameters',
                ErrorCode.INVALID_QUERY_PARAMETERS
            );
        }
    }
}