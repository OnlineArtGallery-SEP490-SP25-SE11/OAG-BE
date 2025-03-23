import { injectable } from 'inversify';
import { Error, Types } from 'mongoose';
import ExhibitionModel, { ExhibitionDocument } from '@/models/exhibition.model';
import logger from '@/configs/logger.config';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@/exceptions/http-exception';
import { ErrorCode } from '@/constants/error-code';
import { CreateExhibitionDto, UpdateExhibitionDto } from '@/dto/exhibition.dto';
import { IExhibitionService, ExhibitionQueryOptions, PaginatedExhibitionResponse } from '@/interfaces/service/exhibition-service.interface';

@injectable()
export class ExhibitionService implements IExhibitionService {
    
}