import { ExhibitionStatus } from '@/constants/enum';
import { Exhibition } from '@/models/exhibition.model';

export class ExhibitionFactory {
  /**
   * Creates an empty exhibition with minimal required data and sensible defaults
   */
  static createEmpty(
    galleryId: any, 
    authorId: any, 
    name: string = 'Untitled Exhibition'
  ): any {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    return {
      gallery: galleryId,
      author: authorId,
      startDate: new Date(),
      endDate,
      status: ExhibitionStatus.DRAFT,
      isFeatured: false,
      contents: [{
        languageCode: 'en',
        name: name,
        description: ''
      }],
      languageOptions: [{
        name: 'EN',
        code: 'en',
        isDefault: true
      }],
      result: {
        visits: 0,
        likes: [],
        totalTime: 0
      },
      public: {
        linkName: '',
        discovery: false
      },
      artworkPositions: []
    };
  }
  /**
   * Updates an existing exhibition object with new data
   * Preserves existing values for properties not included in updateData
   */
  static update(
    existingExhibition: Partial<Exhibition>,
    updateData: Partial<Exhibition>
  ): Partial<Exhibition> {
    return {
      ...existingExhibition,
      ...updateData,
      contents: updateData.contents || existingExhibition.contents,
      languageOptions: updateData.languageOptions || existingExhibition.languageOptions,
      result: {
        ...existingExhibition.result,
        ...updateData.result
      },
      public: {
        ...existingExhibition.public,
        ...updateData.public
      },
      artworkPositions: updateData.artworkPositions || existingExhibition.artworkPositions

    };
  }

  /**
   * Creates a complete exhibition with all required fields
   */
  static createComplete(exhibitionData: Partial<Exhibition>): Partial<Exhibition> {
    // Start with an empty exhibition
    const emptyExhibition = this.createEmpty(
      exhibitionData.gallery as any,
      exhibitionData.author as any,
    );
    
    // Then update it with provided data
    return this.update(emptyExhibition, exhibitionData);
  }

}