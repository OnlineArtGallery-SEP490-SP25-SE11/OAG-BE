import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { IGalleryService } from '@/interfaces/service/gallery-service.interface';
import { BaseHttpResponse } from '@/lib/base-http-response';

@injectable()
