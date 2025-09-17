const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./database');
const config = require('./environment');

// Configuration Google OAuth
if (config.OAUTH.GOOGLE.CLIENT_ID && config.OAUTH.GOOGLE.CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: config.OAUTH.GOOGLE.CLIENT_ID,
        clientSecret: config.OAUTH.GOOGLE.CLIENT_SECRET,
        callbackURL: config.OAUTH.GOOGLE.CALLBACK_URL,
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔍 Google OAuth Profile:', profile);
            
            // Chercher l'utilisateur existant
            const [existingUsers] = await db.execute(
                'SELECT * FROM utilisateurs WHERE email = ?',
                [profile.emails[0].value]
            );

            if (existingUsers.length > 0) {
                console.log('✅ Utilisateur Google existant trouvé:', existingUsers[0].email);
                return done(null, existingUsers[0]);
            }

            // Créer un nouvel utilisateur
            const [result] = await db.execute(`
                INSERT INTO utilisateurs (
                    email, nom, prenom, photo_profil, email_verified, 
                    statut, role_id, created_at
                ) VALUES (?, ?, ?, ?, 1, 'actif', 1, NOW())
            `, [
                profile.emails[0].value,
                profile.name.familyName || '',
                profile.name.givenName || '',
                profile.photos[0]?.value || null
            ]);

            const newUser = {
                id: result.insertId,
                email: profile.emails[0].value,
                nom: profile.name.familyName || '',
                prenom: profile.name.givenName || '',
                photo_profil: profile.photos[0]?.value || null,
                email_verified: 1,
                statut: 'actif',
                role_id: 1
            };

            console.log('✅ Nouvel utilisateur Google créé:', newUser.email);
            return done(null, newUser);

        } catch (error) {
            console.error('❌ Erreur Google OAuth:', error);
            return done(error, null);
        }
    }));
} else {
    console.log('⚠️ Google OAuth non configuré - CLIENT_ID ou CLIENT_SECRET manquant');
}

// Configuration Facebook OAuth
if (config.OAUTH.FACEBOOK.APP_ID && config.OAUTH.FACEBOOK.APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: config.OAUTH.FACEBOOK.APP_ID,
        clientSecret: config.OAUTH.FACEBOOK.APP_SECRET,
        callbackURL: config.OAUTH.FACEBOOK.CALLBACK_URL,
        profileFields: ['id', 'emails', 'name', 'picture']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔍 Facebook OAuth Profile:', profile);
            
            // Chercher l'utilisateur existant
            const [existingUsers] = await db.execute(
                'SELECT * FROM utilisateurs WHERE email = ?',
                [profile.emails[0].value]
            );

            if (existingUsers.length > 0) {
                console.log('✅ Utilisateur Facebook existant trouvé:', existingUsers[0].email);
                return done(null, existingUsers[0]);
            }

            // Créer un nouvel utilisateur
            const [result] = await db.execute(`
                INSERT INTO utilisateurs (
                    email, nom, prenom, photo_profil, email_verified, 
                    statut, role_id, created_at
                ) VALUES (?, ?, ?, ?, 1, 'actif', 1, NOW())
            `, [
                profile.emails[0].value,
                profile.name.familyName || '',
                profile.name.givenName || '',
                profile.photos[0]?.value || null
            ]);

            const newUser = {
                id: result.insertId,
                email: profile.emails[0].value,
                nom: profile.name.familyName || '',
                prenom: profile.name.givenName || '',
                photo_profil: profile.photos[0]?.value || null,
                email_verified: 1,
                statut: 'actif',
                role_id: 1
            };

            console.log('✅ Nouvel utilisateur Facebook créé:', newUser.email);
            return done(null, newUser);

        } catch (error) {
            console.error('❌ Erreur Facebook OAuth:', error);
            return done(error, null);
        }
    }));
} else {
    console.log('⚠️ Facebook OAuth non configuré - APP_ID ou APP_SECRET manquant');
}

// Sérialisation des utilisateurs
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await db.execute(
            'SELECT * FROM utilisateurs WHERE id = ?',
            [id]
        );
        
        if (users.length > 0) {
            done(null, users[0]);
        } else {
            done(null, false);
        }
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
