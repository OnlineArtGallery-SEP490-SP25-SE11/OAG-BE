// sử dụng cho auth.service
interface BaseUserProfile {
	name?: string;
	image?: string;
	name: string;
}

interface PhoneProfile extends BaseUserProfile {
	phone: string;
	password: string;
}

interface OAuthProfile extends BaseUserProfile {
	email: string;
}

export interface Provider {
	provider: string;
	providerAccountId?: string;
}

export type UserProfile = PhoneProfile | OAuthProfile;
function isPhoneProfile(profile: UserProfile): profile is PhoneProfile {
	return 'phone' in profile && 'password' in profile;
}
function isOAuthProfile(profile: UserProfile): profile is OAuthProfile {
	return 'email' in profile && 'name' in profile;
}
export { OAuthProfile, PhoneProfile, isOAuthProfile, isPhoneProfile };

export interface DecodedToken {
	id: string;
	role: string[];
	iat: number;
	exp: number;
}
