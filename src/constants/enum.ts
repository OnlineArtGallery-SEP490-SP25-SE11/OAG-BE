
export enum Status {
	// blog status
    DRAFT = 'DRAFT',           // Initial state when blog is created (replacing INACTIVE)
    PENDING_REVIEW = 'PENDING_REVIEW',  // Artist submitted for publishing (replacing PENDING)
    PUBLISHED = 'PUBLISHED',   // Approved and visible to everyone (replacing ACTIVE)
    REJECTED = 'REJECTED',     // Admin rejected the blog
    ARCHIVED = 'ARCHIVED'      // No longer active but kept for records
}
export enum InteractionType {
	HEART = 'HEART'
}

export enum Role {
	ADMIN = 'admin',
	USER = 'user',
	ARTIST = 'artist'
}
