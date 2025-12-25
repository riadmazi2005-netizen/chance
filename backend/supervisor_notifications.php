<?php
// supervisor_notifications.php - Gestion des notifications du superviseur
require_once 'config.php';

// GET - Récupérer les notifications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['supervisor_id'])) {
        sendError('ID du superviseur requis');
    }

    $supervisorId = $_GET['supervisor_id'];
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
            WHERE recipient_id = :supervisor_id AND recipient_type = 'supervisor'
            ORDER BY created_at DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':supervisor_id', $supervisorId, PDO::PARAM_STR);
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

// POST - Envoyer une notification à un tuteur
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['supervisor_id']) || !isset($input['student_id']) || 
        !isset($input['type']) || !isset($input['message'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer l'élève et son tuteur
        $stmt = $pdo->prepare("
            SELECT 
                s.tutor_id,
                s.first_name,
                s.last_name,
                s.absence_count,
                s.bus_id
            FROM students s
            INNER JOIN buses b ON s.bus_id = b.id
            WHERE s.id = :student_id AND b.supervisor_id = :supervisor_id
        ");
        $stmt->execute([
            'student_id' => $input['student_id'],
            'supervisor_id' => $input['supervisor_id']
        ]);
        $student = $stmt->fetch();

        if (!$student) {
            sendError('Élève non trouvé ou non autorisé', 404);
        }

        // Titres par défaut selon le type
        $titles = [
            'delay' => 'Retard de votre enfant',
            'absence' => 'Absence de votre enfant',
            'complaint' => 'Notification du responsable bus',
            'general' => 'Notification'
        ];

        $title = isset($input['title']) ? $input['title'] : $titles[$input['type']];

        // Créer la notification
        $notifId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                id, recipient_id, recipient_type, sender_id, sender_type,
                type, title, message
            ) VALUES (
                :id, :recipient_id, 'tutor', :sender_id, 'supervisor',
                :type, :title, :message
            )
        ");
        $stmt->execute([
            'id' => $notifId,
            'recipient_id' => $student['tutor_id'],
            'sender_id' => $input['supervisor_id'],
            'type' => $input['type'],
            'title' => $title,
            'message' => $input['message'] ?: 
                       "Concernant {$student['first_name']} {$student['last_name']}"
        ]);

        // Si c'est une absence, mettre à jour le compteur
        if ($input['type'] === 'absence') {
            $newAbsenceCount = ((int)$student['absence_count']) + 1;
            $stmt = $pdo->prepare("
                UPDATE students SET absence_count = :count WHERE id = :id
            ");
            $stmt->execute([
                'count' => $newAbsenceCount,
                'id' => $input['student_id']
            ]);
        }

        $pdo->commit();

        sendResponse([
            'success' => true,
            'notificationId' => $notifId,
            'message' => 'Notification envoyée avec succès'
        ], 201);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de l\'envoi de la notification', 500);
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
        sendError('Erreur lors de la mise à jour', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>