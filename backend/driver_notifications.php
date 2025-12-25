<?php
// driver_notifications.php - Gestion des notifications du chauffeur
require_once 'config.php';

// GET - Récupérer les notifications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['driver_id'])) {
        sendError('ID du chauffeur requis');
    }

    $driverId = $_GET['driver_id'];
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                sender_id as senderId,
                sender_type as senderType,
                type,
                title,
                message,
                is_read as `read`,
                created_at as created_date
            FROM notifications
            WHERE recipient_id = :driver_id AND recipient_type = 'driver'
            ORDER BY created_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':driver_id', $driverId, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $notifications = $stmt->fetchAll();

        // Convertir les booléens
        foreach ($notifications as &$notif) {
            $notif['read'] = (bool)$notif['read'];
        }

        sendResponse(['notifications' => $notifications]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des notifications', 500);
    }
}

// PUT - Marquer une notification comme lue
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['notification_id'])) {
        sendError('ID de la notification requis');
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = :notification_id
        ");
        $stmt->execute(['notification_id' => $input['notification_id']]);

        sendResponse([
            'success' => true,
            'message' => 'Notification marquée comme lue'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour de la notification', 500);
    }
}

// DELETE - Supprimer une notification
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['notification_id'])) {
        sendError('ID de la notification requis');
    }

    try {
        $stmt = $pdo->prepare("
            DELETE FROM notifications 
            WHERE id = :notification_id AND recipient_type = 'driver'
        ");
        $stmt->execute(['notification_id' => $_GET['notification_id']]);

        sendResponse([
            'success' => true,
            'message' => 'Notification supprimée'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la suppression de la notification', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>