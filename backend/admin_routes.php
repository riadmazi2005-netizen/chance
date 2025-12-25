<?php
// admin_routes.php - Gestion CRUD des trajets
require_once 'config.php';

// GET - Récupérer tous les trajets
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                r.id,
                r.route_id as routeId,
                r.departure,
                r.terminus,
                r.departure_time_morning as departureTimeMorning,
                r.arrival_time_morning as arrivalTimeMorning,
                r.departure_time_evening as departureTimeEvening,
                r.arrival_time_evening as arrivalTimeEvening,
                b.bus_id as busName
            FROM routes r
            LEFT JOIN buses b ON r.id = b.route_id
            ORDER BY r.route_id
        ");
        
        sendResponse(['routes' => $stmt->fetchAll()]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des trajets', 500);
    }
}

// POST - Créer un trajet
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['routeId']) || !isset($input['terminus'])) {
        sendError('Données incomplètes (routeId et terminus requis)');
    }

    try {
        $id = generateUUID();
        
        $stmt = $pdo->prepare("
            INSERT INTO routes (
                id, route_id, departure, terminus,
                departure_time_morning, arrival_time_morning,
                departure_time_evening, arrival_time_evening
            ) VALUES (
                :id, :route_id, :departure, :terminus,
                :departure_time_morning, :arrival_time_morning,
                :departure_time_evening, :arrival_time_evening
            )
        ");

        $stmt->execute([
            'id' => $id,
            'route_id' => $input['routeId'],
            'departure' => $input['departure'] ?? 'École Mohammed V',
            'terminus' => $input['terminus'],
            'departure_time_morning' => $input['departureTimeMorning'] ?? null,
            'arrival_time_morning' => $input['arrivalTimeMorning'] ?? null,
            'departure_time_evening' => $input['departureTimeEvening'] ?? null,
            'arrival_time_evening' => $input['arrivalTimeEvening'] ?? null
        ]);

        sendResponse([
            'success' => true,
            'routeId' => $id,
            'message' => 'Trajet créé avec succès'
        ], 201);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la création', 500);
    }
}

// PUT - Mettre à jour un trajet
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        sendError('ID du trajet requis');
    }

    try {
        $updates = [];
        $params = ['id' => $input['id']];

        $fields = [
            'routeId' => 'route_id',
            'departure' => 'departure',
            'terminus' => 'terminus',
            'departureTimeMorning' => 'departure_time_morning',
            'arrivalTimeMorning' => 'arrival_time_morning',
            'departureTimeEvening' => 'departure_time_evening',
            'arrivalTimeEvening' => 'arrival_time_evening'
        ];

        foreach ($fields as $key => $col) {
            if (isset($input[$key])) {
                $updates[] = "$col = :$key";
                $params[$key] = $input[$key];
            }
        }

        if (empty($updates)) {
            sendError('Aucune donnée à mettre à jour');
        }

        $sql = "UPDATE routes SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse([
            'success' => true,
            'message' => 'Trajet mis à jour avec succès'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour', 500);
    }
}

// DELETE - Supprimer un trajet
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        sendError('ID du trajet requis');
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM routes WHERE id = :id");
        $stmt->execute(['id' => $_GET['id']]);

        sendResponse([
            'success' => true,
            'message' => 'Trajet supprimé avec succès'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la suppression', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>