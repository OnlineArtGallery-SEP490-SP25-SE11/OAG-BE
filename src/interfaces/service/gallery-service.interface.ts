/* eslint-disable no-unused-vars */
import { CreateGalleryDto, UpdateGalleryDto } from "@/dto/gallery.dto";
import { GalleryDocument } from "@/models/gallery.model";

export interface GalleryQueryOptions {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    filter?: Record<string, any>;
    search?: string;
}

export interface PaginatedGalleryResponse {
    galleries: GalleryDocument[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }
}

export interface IGalleryService {
    create(data: CreateGalleryDto): Promise<GalleryDocument>;
    findAll(options: GalleryQueryOptions): Promise<PaginatedGalleryResponse>;
    findById(id: string): Promise<GalleryDocument | null>;
    update(id: string, data: UpdateGalleryDto): Promise<GalleryDocument | null>;
    delete(id: string): Promise<GalleryDocument | null>;
}