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