<?php
// driver_expenses.php - Gestion des dépenses quotidiennes du bus
require_once 'config.php';

// GET - Récupérer les dépenses
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['driver_id'])) {
        sendError('ID du chauffeur requis');
    }

    $driverId = $_GET['driver_id'];

    try {
        // Récupérer le bus du chauffeur
        $stmt = $pdo->prepare("
            SELECT id, bus_id
            FROM buses
            WHERE driver_id = :driver_id
            LIMIT 1
        ");
        $stmt->execute(['driver_id' => $driverId]);
        $bus = $stmt->fetch();

        if (!$bus) {
            sendResponse(['expenses' => [], 'bus' => null]);
            exit;
        }

        // Récupérer les dépenses du bus
        $stmt = $pdo->prepare("
            SELECT 
                id,
                bus_id as busId,
                driver_id as driverId,
                date,
                type,
                amount,
                description,
                created_at as createdAt
            FROM bus_expenses
            WHERE bus_id = :bus_id
            ORDER BY date DESC, created_at DESC
        ");
        $stmt->execute(['bus_id' => $bus['id']]);
        $expenses = $stmt->fetchAll();

        // Convertir les montants
        foreach ($expenses as &$expense) {
            $expense['amount'] = (float)$expense['amount'];
        }

        sendResponse([
            'expenses' => $expenses,
            'bus' => [
                'id' => $bus['id'],
                'busId' => $bus['bus_id']
            ]
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des dépenses', 500);
    }
}

// POST - Ajouter une dépense
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['driver_id']) || !isset($input['bus_id']) || 
        !isset($input['date']) || !isset($input['type']) || 
        !isset($input['amount']) || !isset($input['description'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Vérifier que le bus appartient bien au chauffeur
        $stmt = $pdo->prepare("
            SELECT id FROM buses 
            WHERE id = :bus_id AND driver_id = :driver_id
        ");
        $stmt->execute([
            'bus_id' => $input['bus_id'],
            'driver_id' => $input['driver_id']
        ]);

        if (!$stmt->fetch()) {
            sendError('Bus non autorisé', 403);
        }

        // Insérer la dépense
        $expenseId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO bus_expenses (
                id, bus_id, driver_id, date, type, amount, description
            ) VALUES (
                :id, :bus_id, :driver_id, :date, :type, :amount, :description
            )
        ");

        $stmt->execute([
            'id' => $expenseId,
            'bus_id' => $input['bus_id'],
            'driver_id' => $input['driver_id'],
            'date' => $input['date'],
            'type' => $input['type'],
            'amount' => floatval($input['amount']),
            'description' => $input['description']
        ]);

        // Récupérer les infos du chauffeur et du bus
        $stmt = $pdo->prepare("
            SELECT 
                u.first_name,
                u.last_name,
                b.bus_id
            FROM drivers d
            INNER JOIN users u ON d.user_id = u.id
            INNER JOIN buses b ON b.driver_id = d.id
            WHERE d.id = :driver_id AND b.id = :bus_id
        ");
        $stmt->execute([
            'driver_id' => $input['driver_id'],
            'bus_id' => $input['bus_id']
        ]);
        $info = $stmt->fetch();

        // Créer une notification pour l'admin
        $notifId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                id, recipient_id, recipient_type, sender_id, sender_type,
                type, title, message
            ) VALUES (
                :id, 'admin', 'admin', :sender_id, 'driver',
                'general', :title, :message
            )
        ");

        $stmt->execute([
            'id' => $notifId,
            'sender_id' => $input['driver_id'],
            'title' => 'Nouvelle dépense enregistrée',
            'message' => $info['first_name'] . ' ' . $info['last_name'] . 
                        ' a enregistré une dépense de ' . $input['amount'] . 
                        ' DH pour le bus ' . $info['bus_id']
        ]);

        $pdo->commit();

        sendResponse([
            'success' => true,
            'expenseId' => $expenseId,
            'message' => 'Dépense enregistrée avec succès'
        ], 201);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de l\'enregistrement de la dépense', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>