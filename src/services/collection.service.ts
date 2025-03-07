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
		title: string,
		description: string,
		artworks?: string[]
	): Promise<InstanceType<typeof Collection>> {
		try {
			const collection = new Collection({
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

	async update(
		options: UpdateCollectionOptions
	): Promise<InstanceType<typeof Collection>> {
		const session = await startSession();
		session.startTransaction();

		try {
			const collection = await Collection.findById(options.id).session(
				session
			);
			if (!collection) {
				logger.error('Collection not found');
				throw new Error('Collection not found');
			}
			// Ensure artworks is defined
			collection.artworks = collection.artworks || [];

			// Update fields
			if (options.title) {
				collection.title = options.title;
			}
			if (options.description) {
				collection.description = options.description;
			}

			if (options.artworks) {
				for (const artworkId of options.artworks) {
					const sourceCollection = await Collection.findOne({
						_id: { $ne: collection._id },
						artworks: artworkId
					}).session(session);

					if (sourceCollection) {
						await this.move({
							oldCollectionId: sourceCollection._id.toString(),
							newCollectionId: collection._id.toString(),
							artworks: [artworkId]
						});
					} else {
						const existsInCurrentCollection =
							collection.artworks.some(
								(ref) =>
									ref instanceof Types.ObjectId &&
									ref.toString() === artworkId
							);
						if (!existsInCurrentCollection) {
							collection.artworks.push(
								new Types.ObjectId(artworkId)
							);
						}
					}
				}
			}
			await collection.save({ session });
			await session.commitTransaction();
			return collection;
		} catch (error) {
			logger.error(error);
			await session.abortTransaction();
			await session.endSession();
			throw error;
		}
	}

	async move(options: MoveArtworkOptions): Promise<{
		oldCollection: InstanceType<typeof Collection>;
		newCollection: InstanceType<typeof Collection>;
	}> {
		const session = await startSession();
		session.startTransaction();

		try {
			const oldCollection = await Collection.findById(
				options.oldCollectionId
			).session(session);
			const newCollection = await Collection.findById(
				options.newCollectionId
			).session(session);

			if (!oldCollection || !newCollection) {
				logger.error('Collection not found');
				throw new Error('Collection not found');
			}

			// Ensure artworks are defined
			oldCollection.artworks = oldCollection.artworks || [];
			newCollection.artworks = newCollection.artworks || [];

			let artworks: Types.ObjectId[] = [];
			if (options.moveAll) {
				artworks = oldCollection.artworks.map(
					(ref) => new Types.ObjectId(ref.toString())
				);
			} else {
				artworks = (options.artworks || []).map(
					(id) => new Types.ObjectId(id)
				);
			}

			oldCollection.artworks = oldCollection.artworks.filter(
				(artworkId) =>
					!artworks.some((id) =>
						id.equals(artworkId as Types.ObjectId)
					)
			);

			const newArtworkSet = new Set(
				newCollection.artworks.map((ref) => ref.toString())
			);
			artworks.forEach((id) => {
				if (!newArtworkSet.has(id.toString())) {
					newCollection.artworks = newCollection.artworks || [];
					newCollection.artworks.push(id);
				}
			});

			await oldCollection.save({ session });
			await newCollection.save({ session });

			await session.commitTransaction();
			await session.endSession();
			return {
				oldCollection,
				newCollection
			};
		} catch (error) {
			logger.error(error);
			await session.abortTransaction();
			await session.endSession();
			throw error;
		}
	}
}

// export default new CollectionService();