import { CreateGalleryDto, UpdateGalleryDto } from "@/dto/gallery.dto";
import { GalleryDocument } from "@/models/gallery.model";

export interface IGalleryService {
    create(data: CreateGalleryDto): Promise<GalleryDocument>;
    findAll(): Promise<GalleryDocument[]>;
    findById(id: string): Promise<GalleryDocument | null>;
    update(id: string, data: UpdateGalleryDto): Promise<GalleryDocument | null>;
    delete(id: string): Promise<GalleryDocument | null>;
}