import logger from '@/configs/logger.config';
import Collection from '@/models/collection.model';
import { startSession, Types } from 'mongoose';
import { injectable } from 'inversify';

export interface MoveArtworkOptions {
	oldCollectionId: string;
	newCollectionId: string;

	moveAll?: boolean;
	artworks?: string[];
}

export interface UpdateCollectionOptions {
	id: string;
	title?: string;
	description?: string;
	artworks?: string[];
}

@injectable()
export class CollectionService {
	async add(
		userId: string,
		title: string,
		description: string,
		artworks?: string[]
	): Promise<InstanceType<typeof Collection>> {
		try {
			const collection = new Collection({
				userId,
				title,
				description,
				artworks: artworks || []
			});
			return await collection.save();
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

	async get(
		id?: string
	): Promise<
		InstanceType<typeof Collection> | InstanceType<typeof Collection>[]
	> {
		if (id) {
			const collection = await Collection.findById(id);
			if (!collection) {
				throw new Error('Collection not found');
			}
			return collection;
		} else {
			return Collection.find();
		}
	}

	async getByUserId(userId: string): Promise<InstanceType<typeof Collection>[]> {
		try{
			if(!userId){
				throw new Error('User not found');
			}
			const collections = await Collection.find({ userId });
			if(!collections){
				throw new Error('Collection not found');
			}
			return collections;
		}
		catch(error){
			logger.error(error);
			throw error;
		}
	}
	// add artwork to collection or my favorite
	async update(
		id: string,
		artId: string | string[]
	): Promise<InstanceType<typeof Collection>> {
		try {
			if (!id) {
				throw new Error('Collection not found');
			}
			const collection = await Collection.findById(id);
			if (!collection) {
				throw new Error('Collection not found');
			}

			// Ensure artworks array exists
			collection.artworks = collection.artworks || [];

			// Handle both single artwork ID or array of IDs
			const artworkIds = Array.isArray(artId) ? artId : [artId];

			// Add each artwork to collection if not already present
			for (const artwork of artworkIds) {
				const artworkObjectId = new Types.ObjectId(artwork);
				const existsInCollection = collection.artworks.some(
					(existingArt) =>
						existingArt instanceof Types.ObjectId &&
						existingArt.toString() === artworkObjectId.toString()
				);

				if (!existsInCollection) {
					collection.artworks.push(artworkObjectId);
				}
			}

			// Save updated collection
			await collection.save();
			return collection;
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}
	// delete artwork from collection or my favorite
	async delArt(id: string, artId: string): Promise<InstanceType<typeof Collection>> {
		try {
			if (!id) {
				throw new Error('Collection not found');
			}
			const collection = await Collection.findById(id);
			if (!collection) {
				throw new Error('Collection not found');
			}
			
			// Ensure artworks array exists
			collection.artworks = collection.artworks || [];
			
			// Filter out the artwork to be removed
			collection.artworks = collection.artworks.filter(
				(existingArt) => 
					!(existingArt instanceof Types.ObjectId && 
					existingArt.toString() === artId)
			);
			
			// Save the updated collection
			await collection.save();
			return collection;
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

	//delete collection
	async delCollection(id: string): Promise<InstanceType<typeof Collection>> {
		try {
			const collection = await Collection.findByIdAndDelete(id);
			if (!collection) {
				throw new Error('Collection not found');
			}
			return collection;
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

}

// export default new CollectionService();
