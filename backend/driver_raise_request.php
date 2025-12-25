<?php
// driver_raise_request.php - Gestion des demandes d'augmentation
require_once 'config.php';

// POST - Créer une demande d'augmentation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['driver_id']) || !isset($input['reasons'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer le salaire actuel et les infos du chauffeur
        $stmt = $pdo->prepare("
            SELECT 
                d.salary,
                u.first_name,
                u.last_name
            FROM drivers d
            INNER JOIN users u ON d.user_id = u.id
            WHERE d.id = :driver_id
        ");
        $stmt->execute(['driver_id' => $input['driver_id']]);
        $driver = $stmt->fetch();

        if (!$driver) {
            sendError('Chauffeur non trouvé', 404);
        }

        // Créer la demande d'augmentation
        $requestId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO raise_requests (
                id, requester_id, requester_type, current_salary, reasons, status
            ) VALUES (
                :id, :requester_id, 'driver', :current_salary, :reasons, 'pending'
            )
        ");

        $stmt->execute([
            'id' => $requestId,
            'requester_id' => $input['driver_id'],
            'current_salary' => $driver['salary'],
            'reasons' => $input['reasons']
        ]);

        // Créer une notification pour l'admin
        $notifId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                id, recipient_id, recipient_type, sender_id, sender_type,
                type, title, message
            ) VALUES (
                :id, 'admin', 'admin', :sender_id, 'driver',
                'raise_request', :title, :message
            )
        ");

        $stmt->execute([
            'id' => $notifId,
            'sender_id' => $input['driver_id'],
            'title' => 'Demande d\'augmentation',
            'message' => $driver['first_name'] . ' ' . $driver['last_name'] . 
                        ' (Chauffeur) demande une augmentation'
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
    if (!isset($_GET['driver_id'])) {
        sendError('ID du chauffeur requis');
    }

    $driverId = $_GET['driver_id'];

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
            WHERE requester_id = :driver_id AND requester_type = 'driver'
            ORDER BY created_at DESC
        ");
        $stmt->execute(['driver_id' => $driverId]);
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