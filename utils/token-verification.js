import jwt from "jsonwebtoken";
import jwkClient from "jwks-rsa";
// import dotenv from 'dotenv';


// dotenv.config();

const client = jwkClient({
    jwksUri: `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
});

const getSigningKeyAsync = async (kid) => {
    const key = await client.getSigningKey(kid);
    return key.getPublicKey();
}

export async function verifyToken(token) {
    const unverifiedToken = jwt.decode(token, {complete: true});
    if(!unverifiedToken || !unverifiedToken.header.kid){
        throw new Error("Invalid token");
    }

    const publicKey = await getSigningKeyAsync(unverifiedToken.header.kid);

    const decoded = jwt.verify(token, publicKey, {algorithms: ['ES256']});

    return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.app_metadata?.role
    }
}