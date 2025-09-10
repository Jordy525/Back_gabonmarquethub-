const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../config/database');

class EmailService {
    constructor() {
        // Configuration du transporteur email
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Générer un token de vérification
    generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Créer une notification email en base
    async createEmailNotification(userId, type, subject, content) {
        try {
            const [result] = await db.execute(`
                INSERT INTO email_notifications (utilisateur_id, type_notification, sujet, contenu)
                VALUES (?, ?, ?, ?)
            `, [userId, type, subject, content]);

            return result.insertId;
        } catch (error) {
            console.error('Erreur création notification email:', error);
            throw error;
        }
    }

    // Envoyer un email de vérification
    async sendVerificationEmail(user, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const subject = 'Vérifiez votre adresse email - GabMarketHub';
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                    <h1 style="color: #dc2626; margin: 0;">GabMarketHub</h1>
                </div>
                
                <div style="padding: 30px 20px;">
                    <h2 style="color: #333;">Bienvenue ${user.prenom} ${user.nom} !</h2>
                    
                    <p style="color: #666; line-height: 1.6;">
                        Merci de vous être inscrit sur GabMarketHub. Pour activer votre compte, 
                        veuillez cliquer sur le lien ci-dessous :
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #dc2626; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Vérifier mon email
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                        <br><a href="${verificationUrl}">${verificationUrl}</a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        Ce lien expire dans 24 heures.
                    </p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                    © 2025 GabMarketHub. Tous droits réservés.
                </div>
            </div>
        `;

        return await this.sendEmail(user.id, user.email, subject, htmlContent, 'verification');
    }

    // Envoyer un email de changement de statut
    async sendStatusChangeEmail(user, newStatus, reason = null) {
        let subject, content;
        
        switch (newStatus) {
            case 'actif':
                subject = 'Votre compte a été activé - GabMarketHub';
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f0f9ff; padding: 20px; text-align: center;">
                            <h1 style="color: #0369a1; margin: 0;">GabMarketHub</h1>
                        </div>
                        
                        <div style="padding: 30px 20px;">
                            <h2 style="color: #16a34a;">🎉 Félicitations ${user.prenom} !</h2>
                            
                            <p style="color: #666; line-height: 1.6;">
                                Votre compte ${user.role_id === 2 ? 'fournisseur' : 'acheteur'} a été activé avec succès.
                                Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL}/login" 
                                   style="background-color: #16a34a; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Se connecter
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'suspendu':
                subject = 'Votre compte a été suspendu - GabMarketHub';
                content = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #fef2f2; padding: 20px; text-align: center;">
                            <h1 style="color: #dc2626; margin: 0;">GabMarketHub</h1>
                        </div>
                        
                        <div style="padding: 30px 20px;">
                            <h2 style="color: #dc2626;">Compte suspendu</h2>
                            
                            <p style="color: #666; line-height: 1.6;">
                                Bonjour ${user.prenom},<br><br>
                                Votre compte a été temporairement suspendu.
                            </p>
                            
                            ${reason ? `
                                <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                                    <strong>Raison :</strong> ${reason}
                                </div>
                            ` : ''}
                            
                            <p style="color: #666; line-height: 1.6;">
                                Pour plus d'informations, contactez notre support.
                            </p>
                        </div>
                    </div>
                `;
                break;
        }

        return await this.sendEmail(user.id, user.email, subject, content, 'status_change');
    }

    // Envoyer un email de validation de documents
    async sendDocumentValidationEmail(user, status, reason = null) {
        let subject, content;
        
        if (status === 'approved') {
            subject = 'Documents validés - GabMarketHub';
            content = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f0f9ff; padding: 20px; text-align: center;">
                        <h1 style="color: #0369a1; margin: 0;">GabMarketHub</h1>
                    </div>
                    
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #16a34a;">✅ Documents validés</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Bonjour ${user.prenom},<br><br>
                            Vos documents ont été validés avec succès. Votre compte fournisseur est maintenant actif.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/supplier/dashboard" 
                               style="background-color: #16a34a; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Accéder au tableau de bord
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            subject = 'Documents rejetés - GabMarketHub';
            content = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #fef2f2; padding: 20px; text-align: center;">
                        <h1 style="color: #dc2626; margin: 0;">GabMarketHub</h1>
                    </div>
                    
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #dc2626;">❌ Documents rejetés</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Bonjour ${user.prenom},<br><br>
                            Malheureusement, vos documents n'ont pas pu être validés.
                        </p>
                        
                        ${reason ? `
                            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                                <strong>Raison :</strong> ${reason}
                            </div>
                        ` : ''}
                        
                        <p style="color: #666; line-height: 1.6;">
                            Veuillez corriger les problèmes mentionnés et soumettre à nouveau vos documents.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/supplier/documents" 
                               style="background-color: #dc2626; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Soumettre à nouveau
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        return await this.sendEmail(user.id, user.email, subject, content, 'document_validation');
    }

    // Méthode générique pour envoyer un email
    async sendEmail(userId, to, subject, htmlContent, type) {
        let notificationId = null;
        
        try {
            // Créer la notification en base
            notificationId = await this.createEmailNotification(userId, type, subject, htmlContent);

            // Envoyer l'email
            const info = await this.transporter.sendMail({
                from: `"GabMarketHub" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: htmlContent
            });

            // Marquer comme envoyé
            await db.execute(`
                UPDATE email_notifications 
                SET statut_envoi = 'sent', date_envoi = NOW()
                WHERE id = ?
            `, [notificationId]);

            console.log('Email envoyé:', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('Erreur envoi email:', error);

            // Marquer comme échoué
            if (notificationId) {
                await db.execute(`
                    UPDATE email_notifications 
                    SET statut_envoi = 'failed', erreur_envoi = ?, tentatives = tentatives + 1
                    WHERE id = ?
                `, [error.message, notificationId]);
            }

            return { success: false, error: error.message };
        }
    }

    // Traiter la file d'attente des emails en échec
    async processFailedEmails() {
        try {
            const [failedEmails] = await db.execute(`
                SELECT en.*, u.email, u.nom, u.prenom 
                FROM email_notifications en
                JOIN utilisateurs u ON en.utilisateur_id = u.id
                WHERE en.statut_envoi = 'failed' AND en.tentatives < 3
                ORDER BY en.date_creation ASC
                LIMIT 10
            `);

            for (const email of failedEmails) {
                const result = await this.sendEmail(
                    email.utilisateur_id,
                    email.email,
                    email.sujet,
                    email.contenu,
                    email.type_notification
                );

                if (result.success) {
                    console.log(`Email reenvoyé avec succès: ${email.id}`);
                }
            }

        } catch (error) {
            console.error('Erreur traitement emails échoués:', error);
        }
    }
}

module.exports = new EmailService();