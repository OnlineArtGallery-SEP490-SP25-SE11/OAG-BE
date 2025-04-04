import logger from '@/configs/logger.config';
import Album from '@/models/album.model';
import { Types } from 'mongoose';
import { injectable } from 'inversify';

export interface UpdateAlbumtionOptions {
	id: string;
	title?: string;
    category?: string;
	description?: string;
	artworks?: string[];
}

@injectable()
export class AlbumnService {
	async add(
		userId: string,
		title: string,
        category: string,
		description: string,
		artworks?: string[]
	): Promise<InstanceType<typeof Album>> {
		try {
			const album = new Album({
				userId,
				title,
                category,
				description,
				artworks: artworks || []
			});
			return await album.save();
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

	async getById(
		id?: string
	): Promise<
		InstanceType<typeof Album> | InstanceType<typeof Album>[]
	> {
		if (id) {
			const album = await Album.findById(id);
			if (!album) {
				throw new Error('Collection not found');
			}
			return album;
		} else {
			return Album.find();
		}
	}
	// get my collections
	async getByUserId(userId: string): Promise<InstanceType<typeof Album>[]> {
		try{
			if(!userId){
				throw new Error('User not found');
			}
			const albums = await Album.find({ userId })
			.populate({
				path: 'artworks',
				select: 'title url',
				model: 'Artwork' // Explicitly specify the model name
			})
			.exec();
			if(!albums){
				throw new Error('Collection not found');
			}
			return albums;
		}
		catch(error){
			logger.error(error);
			throw error;
		}
	}
	// //get collection of others
	// async getByOtherUserId(userId: string): Promise<InstanceType<typeof Collection>[]> {
	// 	try{
	// 		if(!userId){
	// 			throw new Error('User not found');
	// 		}
	// 		const collections = await Collection.find({ userId });
	// 		if(!collections){
	// 			throw new Error('Collection not found');
	// 		}
	// 		return collections;
	// 	}
	// 	catch(error){
	// 		logger.error(error);
	// 		throw error;
	// 	}
	// }
	// add artwork to collection or my favorite
	async update(
		id: string,
		artId: string | string[]
	): Promise<InstanceType<typeof Album>> {
		try {
			if (!id) {
				throw new Error('Collection not found');
			}
			const album = await Album.findById(id);
			if (!album) {
				throw new Error('Collection not found');
			}

			// Ensure artworks array exists
			album.artworks = album.artworks || [];

			// Handle both single artwork ID or array of IDs
			const artworkIds = Array.isArray(artId) ? artId : [artId];

			// Add each artwork to collection if not already present
			for (const artwork of artworkIds) {
				const artworkObjectId = new Types.ObjectId(artwork);
				const existsInCollection = album.artworks.some(
					(existingArt) =>
						existingArt instanceof Types.ObjectId &&
						existingArt.toString() === artworkObjectId.toString()
				);

				if (!existsInCollection) {
					album.artworks.push(artworkObjectId);
				}
			}

			// Save updated collection
			await album.save();
			return album;
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}
	// delete artwork from collection or my favorite
	async delArt(id: string, artIdInput: string | string[]): Promise<InstanceType<typeof Album>> {
		try {
			if (!id) {
				throw new Error('Collection not found');
			}
			const album = await Album.findById(id);
			if (!album) {
				throw new Error('Collection not found');
			}
			
			// Ensure artworks array exists
			album.artworks = album.artworks || [];
			
			// Handle both single string and array input
			const artIds = Array.isArray(artIdInput) ? artIdInput : [artIdInput];
			
			// Filter out the artworks to be removed - using string comparison
			album.artworks = album.artworks.filter(existingArt => {
				const existingArtString = existingArt.toString();
				return !artIds.includes(existingArtString);
			});
			
			// Log after filtering
			console.log("Collection after filtering:", album.artworks);
			
			// Save the updated collection
			await album.save();
			return album;
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

	//delete collection
	async delAlbum(id: string): Promise<InstanceType<typeof Album>> {
		try {
			const album = await Album.findByIdAndDelete(id);
			if (!album) {
				throw new Error('Collection not found');
			}
			return album;
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

}

// export default new CollectionService();
