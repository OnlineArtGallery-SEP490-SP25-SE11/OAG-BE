//controller.interface.ts
import { Request, Response, NextFunction } from "express";

export interface IBlogTagController {
  createTag(req: Request, res: Response, next: NextFunction): Promise<any>;
  getTags(req: Request, res: Response, next: NextFunction): Promise<any>;
  deleteTag(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IBlogController {
  findAll(req: Request, res: Response, next: NextFunction): Promise<any>;
  findById(req: Request, res: Response, next: NextFunction): Promise<any>;
  findLastEditedByUser(req: Request, res: Response, next: NextFunction): Promise<any>;
  findPublished(req: Request, res: Response, next: NextFunction): Promise<any>;
  create(req: Request, res: Response, next: NextFunction): Promise<any>;
  update(req: Request, res: Response, next: NextFunction): Promise<any>;
  delete(req: Request, res: Response, next: NextFunction): Promise<any>;
  approve(req: Request, res: Response, next: NextFunction): Promise<any>;
  reject(req: Request, res: Response, next: NextFunction): Promise<any>;
  requestPublish(req: Request, res: Response, next: NextFunction): Promise<any>;
  findUserBlogs(req: Request, res: Response, next: NextFunction): Promise<any>;
  find(req: Request, res: Response, next: NextFunction): Promise<any>;
  addHeart(req: Request, res: Response, next: NextFunction): Promise<any>;
  removeHeart(req: Request, res: Response, next: NextFunction): Promise<any>;
  getHeartCount(req: Request, res: Response, next: NextFunction): Promise<any>;
  isHeart(req: Request, res: Response, next: NextFunction): Promise<any>;
  getHeartUsers(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IInteractionController {
  getUserInteractions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any>;
}

export interface IArtistController {
  getProfile(req: Request, res: Response, next: NextFunction): Promise<any>;
  updateProfile(req: Request, res: Response, next: NextFunction): Promise<any>;
  getAllArtists(req: Request, res: Response, next: NextFunction): Promise<any>;
  searchArtists(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface ArtistProfileUpdate {
  bio?: string;
  genre?: string;
  experience?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}
export interface ICommentController {
  create(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getComments(req: Request, res: Response, next: NextFunction): Promise<Response>;
  update(req: Request, res: Response, next: NextFunction): Promise<Response>;
  delete(req: Request, res: Response, next: NextFunction): Promise<Response>;
	// getUserInteractions(
	// 	req: Request,
	// 	res: Response,
	// 	next: NextFunction
	// ): Promise<any>;
}

export interface IArtworkController {
  add(req: Request, res: Response, next: NextFunction): Promise<any>;
  get(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface ICollectionController {
    add(req: Request, res: Response, next: NextFunction): Promise<any>;
    update(req: Request, res: Response, next: NextFunction): Promise<any>;
    get(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IAlbumController{
    add(req: Request, res: Response, next: NextFunction): Promise<any>;
    update(req: Request, res: Response, next: NextFunction): Promise<any>;
    get(req: Request, res: Response, next: NextFunction): Promise<any>;
    getByUserId(req: Request, res: Response, next: NextFunction): Promise<any>;
    getByOtherUserId(req: Request, res: Response, next: NextFunction): Promise<any>;
    getById(req: Request, res: Response, next: NextFunction): Promise<any>;
    delArt(req: Request, res: Response, next: NextFunction): Promise<any>;
    delCollection(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IChatController {
  createChat(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getChatHistory(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getChatList(req: Request, res: Response, next: NextFunction): Promise<Response>;
  getLastMessageWithUsers(req: Request, res: Response, next: NextFunction): Promise<Response>;
  markMessageAsRead(req: Request, res: Response, next: NextFunction): Promise<Response>;
  markAllMessagesAsRead(req: Request, res: Response, next: NextFunction): Promise<Response>;
  deleteMessage(req: Request, res: Response, next: NextFunction): Promise<Response>;
  deleteChat(req: Request, res: Response, next: NextFunction): Promise<Response>;
}
