import { ArtistRequestStatus } from '@/constants/enum';
import { z } from 'zod';
import { CreateCCCDSchema } from './cccd.dto';

export const CreateArtistRequestSchema = z.object({
  cccd: CreateCCCDSchema
  //artistCertificate: z.string().optional()
});

export const UpdateArtistRequestStatusSchema = z.object({
  status: z.nativeEnum(ArtistRequestStatus),
  rejectionReason: z.string().optional()
});

export type CreateArtistRequestDto = z.infer<typeof CreateArtistRequestSchema>;
export type UpdateArtistRequestStatusDto = z.infer<typeof UpdateArtistRequestStatusSchema>;
export type FeaturedArtist = {
  _id: string;
  name: string;
  image: string;
  artworksCount: number;
  exhibitionsCount: number;
  bio: string;
  featuredWorks: {
    _id: string;
    title: string;
    url: string;
    createdAt: string;
  }[];
}
export type TrendingArtist = {
  _id: string;
  name: string;
  image: string;
  followersCount: number;
}