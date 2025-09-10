const { 
    createMessageNotification, 
    createConversationNotification 
} = require('../routes/notifications');

class NotificationService {
    constructor(socketManager = null) {
        this.socketManager = socketManager;
    }

    // Créer une notification pour un nouveau message
    async notifyNewMessage(senderId, recipientId, conversationId, messageContent) {
        try {
            const notification = await createMessageNotification(
                recipientId,
                senderId,
                conversationId,
                messageContent,
                this.socketManager
            );

            console.log(`📢 Notification message créée: ${notification.id} pour utilisateur ${recipientId}`);
            return notification;
        } catch (error) {
            console.error('Erreur création notification message:', error);
            return null;
        }
    }

    // Créer une notification pour une nouvelle conversation
    async notifyNewConversation(initiatorId, recipientId, conversationId, subject) {
        try {
            const notification = await createConversationNotification(
                recipientId,
                initiatorId,
                conversationId,
                subject,
                this.socketManager
            );

            console.log(`📢 Notification conversation créée: ${notification.id} pour utilisateur ${recipientId}`);
            return notification;
        } catch (error) {
            console.error('Erreur création notification conversation:', error);
            return null;
        }
    }

    // Marquer les notifications comme lues
    async markAsRead(userId, notificationIds = null) {
        try {
            if (this.socketManager) {
                return await this.socketManager.markNotificationsAsRead(userId, notificationIds);
            }
            return false;
        } catch (error) {
            console.error('Erreur marquage notifications lues:', error);
            return false;
        }
    }

    // Envoyer une mise à jour du compteur de notifications non lues
    async updateUnreadCount(userId) {
        try {
            if (this.socketManager) {
                return await this.socketManager.sendUnreadCountUpdate(userId);
            }
            return 0;
        } catch (error) {
            console.error('Erreur mise à jour compteur:', error);
            return 0;
        }
    }

    // Envoyer une notification personnalisée
    async sendCustomNotification(userId, title, message, type = 'info', metadata = null) {
        try {
            const { createNotification } = require('../routes/notifications');
            
            const notification = await createNotification(
                userId,
                title,
                message,
                type,
                metadata,
                this.socketManager
            );

            console.log(`📢 Notification personnalisée créée: ${notification.id} pour utilisateur ${userId}`);
            return notification;
        } catch (error) {
            console.error('Erreur création notification personnalisée:', error);
            return null;
        }
    }
}

module.exports = NotificationService;