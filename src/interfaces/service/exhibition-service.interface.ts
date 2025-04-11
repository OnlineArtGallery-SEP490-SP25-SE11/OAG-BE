/* eslint-disable no-unused-vars */
import { ExhibitionDocument } from '@/models/exhibition.model';
import { CreateEmptyExhibitionDto, TicketPurchaseResponse, UpdateExhibitionDto } from '@/dto/exhibition.dto';
import { ExhibitionStatus } from '@/constants/enum';

export interface PaginatedExhibitionResponse {
  exhibitions: ExhibitionDocument[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ExhibitionQueryOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, any>;
  filter?: Record<string, any>;
  search?: string;
  userId?: string;
  status?: ExhibitionStatus | ExhibitionStatus[] | undefined;
}

export interface IExhibitionService {
  create(data: CreateEmptyExhibitionDto): Promise<ExhibitionDocument>;
  findById(id: string): Promise<ExhibitionDocument | null>;
  findByLinkName(linkName: string): Promise<ExhibitionDocument | null>;
  findAll(options?: ExhibitionQueryOptions): Promise<PaginatedExhibitionResponse>;
  update(id: string, data: UpdateExhibitionDto): Promise<ExhibitionDocument | null>;
  delete(id: string): Promise<ExhibitionDocument | null>;
  approveExhibition(id: string): Promise<ExhibitionDocument | null>;
  rejectExhibition(id: string, reason: string): Promise<ExhibitionDocument | null>;
  purchaseTicket(exhibitionId: string, userId: string): Promise<TicketPurchaseResponse>;
  findPublishedById(id: string): Promise<ExhibitionDocument | null>;
  findPublishedByLinkName(linkName: string): Promise<ExhibitionDocument | null>;
}