import { ExhibitionDocument } from '@/models/exhibition.model';
import { CreateEmptyExhibitionDto, UpdateExhibitionDto } from '@/dto/exhibition.dto';

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
}

export interface IExhibitionService {
  create(data: CreateEmptyExhibitionDto): Promise<ExhibitionDocument>;
  findById(id: string): Promise<ExhibitionDocument | null>;
  findByLinkName(linkName: string): Promise<ExhibitionDocument | null>;
  findAll(options?: ExhibitionQueryOptions): Promise<PaginatedExhibitionResponse>;
  update(id: string, data: UpdateExhibitionDto): Promise<ExhibitionDocument | null>;
  delete(id: string): Promise<ExhibitionDocument | null>;
}