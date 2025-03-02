export const TYPES = {
    IBlogService: Symbol.for('IBlogService'),
    BlogService: Symbol.for('BlogService'),

    IInteractionService: Symbol.for('IInteractionService'),
    InteractionService: Symbol.for('InteractionService'),

    IBlogController: Symbol.for('IBlogController'),
    BlogController: Symbol.for('BlogController'),

    IInteractionController: Symbol.for('IInteractionController'),
    InteractionController: Symbol.for('InteractionController'),

    // Artwork
    IArtworkService: Symbol.for('IArtworkService'),
    ArtworkService: Symbol.for('ArtworkService'),

    IArtworkController: Symbol.for('IArtworkController'),
    ArtworkController: Symbol.for('ArtworkController'),

    // Collection
    ICollectionService: Symbol.for('ICollectionService'),
    CollectionService: Symbol.for('CollectionService'),

    ICollectionController: Symbol.for('ICollectionController'),
    CollectionController: Symbol.for('CollectionController'),
}