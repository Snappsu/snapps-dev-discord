import { env } from "cloudflare:workers";


export async function getUser(discordID) {
	try {
		var userData = await env.snapps_dev.getUserByDiscordID(discordID)
		return userData
	} catch (error) {
    console.error(`Error getting profile info!`)
		console.error(error);
	}
}


export async function addUserFlag(userData,flagBits) {
		return await env.snapps_dev.addFlags(userData,flagBits)
}

export async function removeUserFlag(userData,flagBits) {
		return await env.snapps_dev.removeFlags(userData,flagBits)
}

export async function getUserPrivacy(userData) {
		return await env.snapps_dev.isPrivate(userData)
}

export async function getUserKinky(userData) {
		return await env.snapps_dev.isKinky(userData)
}

