<?php
// supervisor_raise_request.php - Demandes d'augmentation pour superviseurs
require_once 'config.php';

// POST - Créer une demande d'augmentation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['supervisor_id']) || !isset($input['reasons'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer le salaire actuel et les infos du superviseur
        $stmt = $pdo->prepare("
            SELECT 
                s.salary,
                u.first_name,
                u.last_name
            FROM supervisors s
            INNER JOIN users u ON s.user_id = u.id
            WHERE s.id = :supervisor_id
        ");
        $stmt->execute(['supervisor_id' => $input['supervisor_id']]);
        $supervisor = $stmt->fetch();

        if (!$supervisor) {
            sendError('Superviseur non trouvé', 404);
        }

        // Créer la demande d'augmentation
        $requestId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO raise_requests (
                id, requester_id, requester_type, current_salary, reasons, status
            ) VALUES (
                :id, :requester_id, 'supervisor', :current_salary, :reasons, 'pending'
            )
        ");

        $stmt->execute([
            'id' => $requestId,
            'requester_id' => $input['supervisor_id'],
            'current_salary' => $supervisor['salary'],
            'reasons' => $input['reasons']
        ]);

        // Créer une notification pour l'admin
        $notifId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                id, recipient_id, recipient_type, sender_id, sender_type,
                type, title, message
            ) VALUES (
                :id, 'admin', 'admin', :sender_id, 'supervisor',
                'raise_request', :title, :message
            )
        ");

        $stmt->execute([
            'id' => $notifId,
            'sender_id' => $input['supervisor_id'],
            'title' => 'Demande d\'augmentation',
            'message' => $supervisor['first_name'] . ' ' . $supervisor['last_name'] . 
                        ' (Responsable Bus) demande une augmentation'
        ]);

        $pdo->commit();

        sendResponse([
            'success' => true,
            'requestId' => $requestId,
            'message' => 'Demande envoyée avec succès'
        ], 201);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de l\'envoi de la demande', 500);
    }
}

// GET - Récupérer l'historique des demandes
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['supervisor_id'])) {
        sendError('ID du superviseur requis');
    }

    $supervisorId = $_GET['supervisor_id'];

    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                current_salary as currentSalary,
                reasons,
                status,
                created_at as createdAt,
                updated_at as updatedAt
            FROM raise_requests
            WHERE requester_id = :supervisor_id AND requester_type = 'supervisor'
            ORDER BY created_at DESC
        ");
        $stmt->execute(['supervisor_id' => $supervisorId]);
        $requests = $stmt->fetchAll();

        // Convertir les montants
        foreach ($requests as &$request) {
            $request['currentSalary'] = (float)$request['currentSalary'];
        }

        sendResponse(['requests' => $requests]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des demandes', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>